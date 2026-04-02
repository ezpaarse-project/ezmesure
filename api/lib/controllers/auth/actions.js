const config = require('config');
const { add, format } = require('date-fns');
const { fr } = require('date-fns/locale');

const { getPermissionsFromPreset, mergePresets } = require('../../utils/roles');
const { getNotificationRecipients } = require('../../utils/notifications');
const { EVENT_TYPES, ADMIN_NOTIFICATION_TYPES } = require('../../utils/notifications/constants');

const UsersService = require('../../entities/users.service');
const MembershipsService = require('../../entities/memberships.service');
const ElasticRoleService = require('../../entities/elastic-roles.service');
const RolesService = require('../../entities/roles.service');
const InstitutionsService = require('../../entities/institutions.service');

const { getToken: getReportingToken } = require('../../services/ezreeport/users');
const { appLogger } = require('../../services/logger');
const { sendMail, generateMail } = require('../../services/mail');

const { prepareStandardQueryParams } = require('../../services/std-query');

const { generateAppToken } = require('./apptokens');

const { schema: membershipSchema, includableFields: includableMembershipFields } = require('../../entities/memberships.dto');
const { schema: elasticRoleSchema, includableFields: includableElasticRoleFields } = require('../../entities/elastic-roles.dto');

const { deleteDurationDays } = config.get('users');

// Query params for sub routes

const standardMembershipsQueryParams = prepareStandardQueryParams({
  schema: membershipSchema,
  includableFields: includableMembershipFields,
  queryFields: [],
});
exports.standardMembershipsQueryParams = standardMembershipsQueryParams;

const standardElasticRolesQueryParams = prepareStandardQueryParams({
  schema: elasticRoleSchema,
  includableFields: includableElasticRoleFields,
  queryFields: [],
});
exports.standardElasticRolesQueryParams = standardElasticRolesQueryParams;

// Routes

exports.getCurrentUser = async (ctx) => {
  const usersService = new UsersService();
  const user = await usersService.findUnique({
    where: { username: ctx.state.user.username },
  });

  if (!user) {
    ctx.throw(401, ctx.$t('errors.auth.unableToFetchUser'));
    return;
  }

  ctx.status = 200;
  ctx.body = user;
};

exports.getCurrentUserAppToken = async (ctx) => {
  ctx.status = 200;
  ctx.body = generateAppToken(ctx.state.user);
};

exports.getCurrentUserReportingToken = async (ctx) => {
  const token = await getReportingToken(ctx?.state?.user?.username);
  ctx.body = { token };
};

exports.getCurrentUserMemberships = async (ctx) => {
  const { username } = ctx.state.user;

  const prismaQuery = standardMembershipsQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.where.username = username;

  ctx.status = 200;
  const membershipsService = new MembershipsService();
  ctx.body = await membershipsService.findMany(prismaQuery);
};

exports.getCurrentUserElasticRoles = async (ctx) => {
  const { username } = ctx.state.user;

  const prismaQuery = standardElasticRolesQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.where.users = { some: { username } };

  ctx.status = 200;
  const elasticRolesService = new ElasticRoleService();
  ctx.body = await elasticRolesService.findMany(prismaQuery);
};

exports.deleteCurrentUser = async (ctx) => {
  const { username, email } = ctx.state.user;

  const deletedAt = add(new Date(), { days: deleteDurationDays });

  const usersService = new UsersService();

  await usersService.update({
    where: { username },
    data: { deletedAt },
  });

  appLogger.verbose(`User [${username}] will be deleted at [${deletedAt.toISOString()}]`);

  try {
    const admins = await getNotificationRecipients(
      ADMIN_NOTIFICATION_TYPES.userRequestDeletion,
      [email],
    );

    await sendMail({
      to: email,
      bcc: admins,
      subject: 'Votre demande de suppression à bien été prise en compte',
      ...generateMail('user-deletion-requested', {
        deletedAt: format(deletedAt, 'PPPp', { locale: fr }),
        isFromUser: true,
      }),
    });
  } catch (err) {
    appLogger.error(`Failed to send mail to ${email}: ${err}`);
  }

  ctx.status = 204;
};

exports.changeExcludeNotifications = async (ctx) => {
  const { body } = ctx.request;
  const { username } = ctx.state.user;

  const service = new UsersService();
  const user = await service.update({
    where: { username },
    data: { excludeNotifications: body },
  });

  ctx.status = 200;
  ctx.body = user.excludeNotifications;
};

exports.joinInstitution = async (ctx) => {
  const { institutionId } = ctx.params;
  const { user } = ctx.state;

  const institution = await (new InstitutionsService()).findUnique({
    where: { id: institutionId },
    select: {
      openAccess: true,
      memberships: {
        where: { username: user.username },
      },
      spaces: {
        select: { id: true },
      },
      repositories: {
        select: { pattern: true },
      },
      repositoryAliases: {
        select: { pattern: true },
      },
    },
  });

  if (!institution) {
    ctx.throw(404, ctx.$t('errors.institution.notFound'));
  }
  if (institution.memberships.length > 0) {
    ctx.status = 200;
    ctx.body = institution.memberships.at(0);
    return;
  }
  if (institution.openAccess !== true) {
    ctx.throw(403, ctx.$t('errors.institution.join.notOpen', institution.name));
  }

  const selfRegisterRoles = await (new RolesService()).findMany({
    select: { id: true, permissionsPreset: true },
    where: {
      autoAssign: { has: EVENT_TYPES.selfJoinInstitution },
    },
  });

  const mergedPreset = mergePresets(
    selfRegisterRoles.map((role) => role.permissionsPreset),
    { keepNone: false },
  );

  ctx.status = 201;
  ctx.body = await (new MembershipsService()).create({
    data: {
      institutionId,
      username: user.username,
      roles: {
        createMany: {
          data: selfRegisterRoles.map((role) => ({ roleId: role.id })),
        },
      },
      permissions: {
        set: getPermissionsFromPreset(mergedPreset),
      },
      spacePermissions: !mergedPreset.spaces ? undefined : {
        createMany: {
          data: institution.spaces.map((space) => ({
            spaceId: space.id,
            readonly: mergedPreset.spaces !== 'write',
          })),
        },
      },
      repositoryPermissions: !mergedPreset.repositories ? undefined : {
        createMany: {
          data: institution.repositories.map((repo) => ({
            repositoryPattern: repo.pattern,
            readonly: mergedPreset.repositories !== 'write',
          })),
        },
      },
      repositoryAliasPermissions: !mergedPreset.repositories ? undefined : {
        createMany: {
          data: institution.repositoryAliases.map((alias) => ({
            aliasPattern: alias.pattern,
          })),
        },
      },
    },
  });
};

exports.leaveInstitution = async (ctx) => {
  const { institutionId } = ctx.params;
  const { user } = ctx.state;

  const memberships = new MembershipsService();

  const membership = await memberships.findUnique({
    where: {
      username_institutionId: {
        institutionId,
        username: user.username,
      },
    },
    select: {
      locked: true,
    },
  });

  if (!membership) {
    ctx.status = 204;
    return;
  }

  if (membership?.locked) {
    ctx.throw(403, ctx.$t('errors.institution.leave.locked'));
  }

  await memberships.delete({
    where: {
      username_institutionId: {
        institutionId,
        username: user.username,
      },
    },
  });

  ctx.status = 204;
};
