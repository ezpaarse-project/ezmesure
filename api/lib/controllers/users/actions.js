const jwt = require('jsonwebtoken');
const config = require('config');

const UsersService = require('../../entities/users.service');
const { sendActivateUserMail } = require('../auth/mail');
const { appLogger } = require('../../services/logger');
const { activateUserLink } = require('../auth/password');
const { schema, adminImportSchema, includableFields } = require('../../entities/users.dto');

const { prepareStandardQueryParams } = require('../../services/std-query');
const { arrayFilter } = require('../../services/std-query/filters');

const standardQueryParams = prepareStandardQueryParams({
  schema,
  includableFields,
  queryFields: ['username', 'fullName'],
});
exports.standardQueryParams = standardQueryParams;

const secret = config.get('auth.secret');
const cookie = config.get('auth.cookie');

function generateToken(user) {
  if (!user) { return null; }

  const { username, email } = user;
  return jwt.sign({ username, email }, secret);
}

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
    roles,
    permissions,
  } = ctx.query;

  const prismaQuery = standardQueryParams.getPrismaManyQuery(ctx);

  if (roles != null || permissions != null) {
    prismaQuery.where.memberships = {
      some: {
        roles: arrayFilter(roles),
        permissions: arrayFilter(permissions),
      },
    };
  }

  prismaQuery.select = Object.assign(
    {},
    ...source.split(',').map((field) => ({ [field.trim()]: true })),
  );
  if (source === '*') {
    prismaQuery.select = undefined;
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
    update: { ...body, username },
    create: { ...body, username },
  });
  appLogger.verbose(`User [${user.username}] is upserted`);

  ctx.body = user;

  if (!userExists) {
    const origin = ctx.get('origin');
    const link = activateUserLink(origin, username);
    const userData = { username, email: body.email };
    try {
      await sendActivateUserMail(userData, link);
    } catch (err) {
      appLogger.error(`Failed to send mail: ${err}`);
    }
  }

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
            ...(membership ?? {}),
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

  const usersService = new UsersService();
  const found = !!(await usersService.delete({ where: { username } }));
  appLogger.verbose(`User [${username}] is deleted`);

  ctx.status = 200;
  ctx.body = { found };
};

exports.impersonateUser = async (ctx) => {
  const { username } = ctx.params;

  const usersService = new UsersService();
  const user = await usersService.findUnique({ where: { username } });

  if (!user) {
    ctx.throw(404, ctx.$t('errors.user.notFound'));
  }

  ctx.cookies.set(cookie, generateToken(user), { httpOnly: true });
  ctx.body = user;
  ctx.status = 200;
};
