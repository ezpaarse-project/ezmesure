const config = require('config');

const { sendMail, generateMail } = require('../../../services/mail');
const { appLogger } = require('../../../services/logger');
const { prepareStandardQueryParams } = require('../../../services/std-query');
const { client: prisma } = require('../../../services/prisma');

const UsersService = require('../../../entities/users.service');
const MembershipsService = require('../../../entities/memberships.service');
const MembershipRolesService = require('../../../entities/memberships-roles.service');
const RolesService = require('../../../entities/roles.service');

/* eslint-disable max-len */
/**
 * @typedef {import('../../../.prisma/client.mjs').Prisma.MembershipFindManyArgs} MembershipFindManyArgs
 * @typedef {import('../../../.prisma/client.mjs').Prisma.UserSelect} UserSelect
 */
/* eslint-enable max-len */

const {
  includableFields,
  schema,
  adminUpsertSchema,
  upsertSchema,
} = require('../../../entities/memberships.dto');

const { NOTIFICATION_TYPES } = require('../../../utils/notifications/constants');

const sender = config.get('notifications.sender');
const supportRecipients = config.get('notifications.supportRecipients');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['username'],
});
exports.standardQueryParams = standardQueryParams;

function sendNewContact(receiver, institutionName, role) {
  const data = {
    contactBlogLink: 'https://blog.ezpaarse.org/2022/02/correspondants-ezmesure-votre-nouveau-role/',
    institution: institutionName,
    role,
  };

  return sendMail({
    from: sender,
    to: receiver,
    cc: supportRecipients,
    subject: `Vous êtes correspondant de ${institutionName}`,
    ...generateMail('new-contact', { data }),
  });
}

exports.getInstitutionMembers = async (ctx) => {
  /** @type {MembershipFindManyArgs} */
  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);
  prismaQuery.where.institutionId = ctx.state.institution.id;

  if (!ctx.state.user.isAdmin) {
    // Hide users that are soft deleted
    prismaQuery.where.user = {
      ...prismaQuery.where.user,
      deletedAt: { equals: null },
    };

    // Hide emails if not admin and institution is an onboarding one (if user is requested)
    if (prismaQuery.include?.user && ctx.state.institution.onboarding) {
      prismaQuery.include.user = {
        select: {
          // Select everything by default
          ...Object.fromEntries(
            Object.keys(prisma.user.fields).map((key) => [key, true]),
          ),
          // Add requested (sub) includes
          ...(typeof prismaQuery.include.user === 'object' ? prismaQuery.include.user.include : {}),
          // Remove email
          email: false,
        },
      };
    }
  }

  const membershipsService = new MembershipsService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await membershipsService.count({ where: prismaQuery.where }));
  ctx.body = await membershipsService.findMany(prismaQuery);
};

exports.getInstitutionMember = async (ctx) => {
  const { institutionId, username } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaOneQuery(
    ctx,
    { username_institutionId: { institutionId, username } },
  );

  // Hide emails if not admin and institution is an onboarding one (if user is requested)
  if (!ctx.state.user.isAdmin && prismaQuery.include?.user && ctx.state.institution.onboarding) {
    prismaQuery.include.user = {
      select: {
        // Select everything by default
        ...Object.fromEntries(
          Object.keys(prisma.user.fields).map((key) => [key, true]),
        ),
        // Add requested (sub) includes
        ...(typeof prismaQuery.include.user === 'object' ? prismaQuery.include.user.include : {}),
        // Remove email
        email: false,
      },
    };
  }

  const membershipsService = new MembershipsService();
  const membership = await membershipsService.findUnique(prismaQuery);
  if (!membership) {
    ctx.throw(404, ctx.$t('errors.member.notFound'));
  }

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = membership;
};

exports.addInstitutionMember = async (ctx) => {
  ctx.action = 'institutions/addMember';

  const {
    institution,
    user: connectedUser,
  } = ctx.state;
  const { username } = ctx.params;
  const {
    id: institutionId,
    name: institutionName,
  } = institution;

  const membershipSchema = connectedUser?.isAdmin ? adminUpsertSchema : upsertSchema;
  const { value: body } = membershipSchema.validate({
    ...ctx.request.body,
    institutionId,
    username,
  });

  ctx.metadata = {
    institutionId,
    institutionName,
    username,
  };

  const usersService = new UsersService();
  const membershipsService = new MembershipsService();

  const user = await usersService.findUnique({
    where: { username },
    include: {
      memberships: {
        where: { institutionId },
      },
    },
  });

  if (!user) {
    ctx.throw(404, ctx.$t('errors.user.notFound'));
  }

  const membership = user.memberships?.[0];

  if ((membership?.locked) && !connectedUser?.isAdmin) {
    ctx.throw(409, ctx.$t('errors.members.notEditable'));
  }

  const membershipData = {
    permissions: ['institution:read'],
    ...body,
    user: { connect: { username } },
    institution: { connect: { id: institutionId } },
  };

  const newMembership = await membershipsService.upsert({
    where: {
      username_institutionId: { username, institutionId },
    },
    include: {
      repositoryPermissions: true,
      spacePermissions: true,
      user: true,
    },
    create: membershipData,
    update: membershipData,
  });
  appLogger.info(`Membership between user [${username}] and institution [${institutionId}] is upserted`);

  ctx.status = 200;
  ctx.body = newMembership;
};

exports.removeInstitutionMember = async (ctx) => {
  ctx.action = 'institutions/removeMember';

  const { institution, user: connectedUser } = ctx.state;
  const { username } = ctx.params;
  const { id: institutionId } = institution;

  ctx.metadata = {
    institutionId: institution.id,
    institutionName: institution.name,
    username,
  };

  const usersService = new UsersService();
  const membershipsService = new MembershipsService();

  const user = await usersService.findUnique({
    where: { username },
    select: {
      memberships: {
        where: { institutionId },
      },
    },
  });

  if (!user) {
    ctx.throw(404, ctx.$t('errors.user.notFound'));
  }

  const membership = user.memberships?.[0];

  if ((membership?.locked) && !connectedUser?.isAdmin) {
    ctx.throw(409, ctx.$t('errors.members.notEditable'));
  }

  if (!membership) {
    ctx.status = 200;
    ctx.body = { message: ctx.$t('nothingToDo') };
    return;
  }

  try {
    await membershipsService.delete({
      where: {
        username_institutionId: { username, institutionId },
      },
    });
  } catch (e) {
    ctx.throw(500, ctx.$t('errors.user.failedToUpdateRoles'));
  }

  ctx.status = 200;
  ctx.body = { message: ctx.$t('userUpdated') };
};

exports.requestMembership = async (ctx) => {
  ctx.action = 'institutions/requestMembership';
  const { institutionId } = ctx.params;

  const usersService = new UsersService();

  const usersToNotify = await usersService.findMany({
    select: {
      email: true,
    },
    where: {
      memberships: {
        some: {
          institutionId,
          user: {
            deletedAt: { equals: null },
          },
          roles: {
            some: {
              role: {
                notifications: { has: NOTIFICATION_TYPES.membershipRequest },
              },
            },
          },
        },
      },
    },
  });

  const emails = usersToNotify.map((user) => user.email);
  const linkInstitution = `${ctx.get('origin')}/myspace/institutions/${institutionId}/members`;

  await sendMail({
    from: sender,
    to: emails.length > 0 ? emails : supportRecipients,
    cc: supportRecipients,
    subject: 'Un utilisateur souhaite rejoindre votre établissement',
    ...generateMail('request-membership', {
      user: ctx.state.user.username,
      institution: ctx.state.institution.name,
      linkInstitution,
    }),
  });

  ctx.type = 'json';
  ctx.status = 204;
};

exports.removeInstitutionMemberRole = async (ctx) => {
  const { user } = ctx.state;
  const { institutionId, username, roleId } = ctx.params;

  await MembershipRolesService.$transaction(async (membershipRolesService) => {
    const membershipRole = await membershipRolesService.findUnique({
      where: {
        username_institutionId_roleId: { roleId, username, institutionId },
      },
      select: {
        role: {
          select: {
            restricted: true,
          },
        },
      },
    });

    if (!membershipRole) {
      return null;
    }

    if (membershipRole.role.restricted && !user.isAdmin) {
      ctx.throw(403, ctx.$t('errors.role.restricted', roleId));
    }

    await membershipRolesService.delete({
      where: {
        username_institutionId_roleId: { roleId, username, institutionId },
      },
    });
  });

  ctx.status = 204;
};

exports.addInstitutionMemberRole = async (ctx) => {
  const { user } = ctx.state;
  const { institutionId, username, roleId } = ctx.params;

  const {
    updatedMembership,
    alreadyHasRole,
    appliedRole,
  } = await MembershipsService.$transaction(async (membershipsService) => {
    const membership = await membershipsService.findUnique({
      where: {
        username_institutionId: { username, institutionId },
      },
      include: {
        institution: true,
        user: true,
        roles: true,
      },
    });

    if (!membership) {
      ctx.throw(404, ctx.$t('errors.membership.notFound'));
    }

    const hasRole = membership.roles.some((role) => role.id === roleId);

    if (hasRole) {
      return {
        updatedMembership: membership,
        alreadyHasRole: hasRole,
      };
    }

    const rolesService = new RolesService(membershipsService);
    const role = await rolesService.findUnique({ where: { id: roleId } });

    if (!role) {
      ctx.throw(404, ctx.$t('errors.role.notFound', role.id));
    }

    if (role.restricted && !user.isAdmin) {
      ctx.throw(403, ctx.$t('errors.role.restricted', role.id));
    }

    const newMembership = await membershipsService.update({
      where: {
        username_institutionId: { username, institutionId },
      },
      data: {
        roles: {
          connectOrCreate: {
            where: {
              username_institutionId_roleId: { username, institutionId, roleId },
            },
            create: {
              roleId,
            },
          },
        },
      },
      include: {
        institution: true,
        user: true,
        roles: true,
      },
    });

    return {
      updatedMembership: newMembership,
      alreadyHasRole: false,
      appliedRole: role,
    };
  });

  const shouldBeNotified = appliedRole.notifications.includes(NOTIFICATION_TYPES.roleAssigned);
  const { email } = updatedMembership.user;

  if (shouldBeNotified && !alreadyHasRole && email) {
    try {
      await sendNewContact(email, updatedMembership.institution.name, appliedRole);
    } catch (err) {
      appLogger.error(`Failed to send new contact mail: ${err}`);
    }
  }

  ctx.status = 200;
  ctx.body = updatedMembership;
};
