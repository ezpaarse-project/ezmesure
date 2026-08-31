const config = require('config');
const { add } = require('date-fns');

const { signJWE } = require('../../utils/jwt');

const { appLogger } = require('../../services/logger');
const { sendMail, generateMail } = require('../../services/mail');

const UsersService = require('../../entities/users.service');
const { schema, adminImportSchema, includableFields } = require('../../entities/users.dto');

const { prepareStandardQueryParams } = require('../../services/std-query');
const { arrayFilter } = require('../../services/std-query/filters');
const { stringToArray } = require('../../services/utils');
const { logoutUser, AUTH_COOKIE } = require('../../services/kibana');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['username', 'fullName'],
});
exports.standardQueryParams = standardQueryParams;

const publicUrl = config.get('publicUrl');
const { cookie } = config.get('auth');
const { deleteDurationDays = 7, impersonateDuration } = config.get('users');

exports.getUser = async (ctx) => {
  const { username } = ctx.params;

  const prismaQuery = standardQueryParams.getPrismaOneQuery(ctx, { username });

  const usersService = new UsersService();
  const user = await usersService.findUnique({
    ...prismaQuery,
    select: ctx.state?.user?.isAdmin ? null : { fullName: true, username: true },
    include: ctx.state?.user?.isAdmin ? prismaQuery.include : undefined,
  });

  if (!user) {
    ctx.throw(404, ctx.$t('errors.user.notFound'));
    return;
  }

  ctx.status = 200;
  ctx.body = user;
};

exports.list = async (ctx) => {
  const {
    source = 'fullName,username',
    roles: rolesParam,
    'roles[some]': someRolesParam,
    'roles[every]': everyRolesParam,
    permissions,
    'permissions[some]': somePermissions,
    'permissions[every]': everyPermissions,
  } = ctx.query;

  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);

  if (permissions != null) {
    prismaQuery.where.memberships = {
      ...prismaQuery.where.memberships,
      some: {
        permissions: somePermissions ? arrayFilter(somePermissions, 'some') : arrayFilter(everyPermissions ?? permissions, 'every'),
      },
    };
  }

  if (rolesParam != null || someRolesParam != null || everyRolesParam != null) {
    const roles = stringToArray(rolesParam);
    const someRoles = stringToArray(someRolesParam);
    const everyRoles = stringToArray(everyRolesParam);

    if (roles.length + someRoles.length + everyRoles.length === 0) {
      prismaQuery.where.memberships = {
        AND: [
          prismaQuery.where.memberships ?? {},
          { every: { roles: { none: {} } } },
        ],
      };
    } else {
      const operator = someRoles.length > 0 ? 'OR' : 'AND';

      prismaQuery.where[operator] = [
        ...(prismaQuery.where[operator] ?? []),
        ...[...someRoles, ...everyRoles, ...roles].map((role) => ({
          memberships: {
            some: {
              roles: { some: { roleId: role } },
            },
          },
        })),
      ];
    }
  }

  if (source !== '*') {
    prismaQuery.select = Object.assign(
      {},
      ...source.split(',').map((field) => ({ [field.trim()]: true })),
      prismaQuery.include,
    );
    prismaQuery.include = undefined;
  }

  if (!ctx.state?.user?.isAdmin) {
    prismaQuery.include = undefined;
  }

  const usersService = new UsersService();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.set('X-Total-Count', await usersService.count({ where: prismaQuery.where }));
  ctx.body = await usersService.findMany(prismaQuery);
};

exports.createOrReplaceUser = async (ctx) => {
  const { username } = ctx.params;
  const { body } = ctx.request;

  const usersService = new UsersService();
  const userExists = !!(await usersService.findUnique({ where: { username } }));

  const user = await usersService.upsert({
    where: { username },
    update: { ...body },
    create: { ...body, username },
  });
  appLogger.verbose(`User [${user.username}] is upserted`);

  ctx.body = user;

  ctx.status = userExists ? 200 : 201;
};

exports.importUsers = async (ctx) => {
  const { body = [] } = ctx.request;
  const { overwrite } = ctx.query;

  const response = {
    errors: 0,
    conflicts: 0,
    created: 0,
    items: [],
  };

  const addResponseItem = (data, status, message) => {
    if (status === 'error') { response.errors += 1; }
    if (status === 'conflict') { response.conflicts += 1; }
    if (status === 'created') { response.created += 1; }

    response.items.push({
      status,
      message,
      data,
    });
  };

  /**
   * @param {UsersService} usersService
   * @param {*} itemData
   */
  const importItem = async (usersService, itemData = {}) => {
    const { value: item, error } = adminImportSchema.validate(itemData);

    if (error) {
      addResponseItem(item, 'error', error.message);
      return;
    }

    if (item.username) {
      const user = await usersService.findUnique({
        where: { username: item.username },
      });

      if (user && !overwrite) {
        addResponseItem(item, 'conflict', ctx.$t('errors.user.import.alreadyExists', user.username));
        return;
      }
    }

    const userData = {
      username: item.username,
      fullName: item.fullName,
      email: item.email,
      isAdmin: !!item.isAdmin,
      metadata: item.metadata,

      memberships: {
        connectOrCreate: item.memberships?.map?.((membership) => ({
          where: {
            username_institutionId: {
              username: item.username,
              institutionId: membership?.institutionId,
            },
          },
          create: {
            ...membership,
            institutionId: undefined,

            institution: {
              connect: { id: membership?.institutionId },
            },

            spacePermissions: {
              connectOrCreate: membership?.spacePermissions?.map?.((perm) => ({
                where: {
                  username_spaceId: {
                    username: item.username,
                    spaceId: perm?.spaceId,
                  },
                },
                create: perm,
              })),
            },

            repositoryPermissions: {
              connectOrCreate: membership?.repositoryPermissions?.map?.((perm) => ({
                where: {
                  username_repositoryPattern: {
                    username: item.username,
                    repositoryPattern: perm?.repositoryPattern,
                  },
                },
                create: perm,
              })),
            },
          },
        })),
      },
    };

    const user = await usersService.upsert({
      where: { username: item.username },
      create: userData,
      update: userData,
    });

    addResponseItem(user, 'created');
  };

  await UsersService.$transaction(async (usersService) => {
    for (let i = 0; i < body.length; i += 1) {
      const userData = body[i] || {};

      try {
        // eslint-disable-next-line no-await-in-loop
        await importItem(usersService, userData);
      } catch (e) {
        addResponseItem(userData, 'error', e.message);
      }
    }
  });

  ctx.type = 'json';
  ctx.body = response;
};

exports.updateUser = async (ctx) => {
  const { username } = ctx.params;
  const { body } = ctx.request;

  const usersService = new UsersService();
  const userExists = !!(await usersService.findUnique({ where: { username } }));

  if (!userExists) {
    ctx.throw(404, ctx.$t('errors.user.notFound'));
  }

  const user = await usersService.update({
    where: { username },
    data: { ...body, username },
  });
  appLogger.verbose(`User [${username}] is updated`);

  ctx.body = user;
  ctx.status = 200;
};

exports.deleteUser = async (ctx) => {
  const { username } = ctx.request.params;
  const { force } = ctx.query;

  const usersService = new UsersService();
  const user = await usersService.findUnique({ where: { username } });

  if (!user) {
    ctx.status = 200;
    ctx.body = { found: false };
    return;
  }

  if (force) {
    await usersService.delete({ where: { username } });
    appLogger.verbose(`User [${username}] is deleted`);

    ctx.status = 200;
    ctx.body = { found: true };
    return;
  }

  const deletedAt = add(new Date(), { days: deleteDurationDays });

  await usersService.update({
    where: { username },
    data: { deletedAt },
  });

  appLogger.verbose(`User [${username}] will be deleted at [${deletedAt.toISOString()}]`);

  try {
    await sendMail({
      to: user.email,
      ...await generateMail(
        'user-deletion-requested',
        {
          loginURL: new URL('/authenticate', publicUrl).href,
          deletedAt,
        },
        {
          locale: user.language,
          subjectKey: 'subject.fromAdmin',
        },
      ),
    });
  } catch (err) {
    appLogger.error(`Failed to send mail to ${user.email}: ${err}`);
  }

  ctx.status = 200;
  ctx.body = { found: true };
};

exports.impersonateUser = async (ctx) => {
  const { user } = ctx.state;
  const { username } = ctx.params;

  const usersService = new UsersService();
  const targetUser = await usersService.findUnique({ where: { username } });
  if (!targetUser) {
    ctx.throw(404, ctx.$t('errors.user.notFound'));
  }

  const ezToken = await signJWE(
    { id: targetUser.id, impersonatedBy: user.username },
    { expiresIn: impersonateDuration },
  );

  // Try to logout from kibana
  try {
    await logoutUser(ctx.cookies.get(AUTH_COOKIE.name));
  } catch (err) {
    appLogger.warn(`Failed to logout from kibana for ${ctx.state.user.username}: ${err}`);
  }

  // Reset cookie on client side
  ctx.cookies.set(AUTH_COOKIE.name, '', AUTH_COOKIE.params);

  ctx.cookies.set(cookie, ezToken, { httpOnly: true });
  ctx.body = user;
  ctx.status = 200;
};
