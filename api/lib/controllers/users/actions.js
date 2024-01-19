const usersService = require('../../entities/users.service');
const { sendActivateUserMail } = require('../auth/mail');
const { appLogger } = require('../../services/logger');
const { activateUserLink } = require('../auth/password');
const { adminImportSchema, includableFields } = require('../../entities/users.dto');
const { propsToPrismaInclude } = require('../utils');

exports.getUser = async (ctx) => {
  const { username } = ctx.params;
  const { user: connectedUser } = ctx.state;

  const user = await usersService.findUnique({
    select: connectedUser.isAdmin ? null : { fullName: true, username: true },
    where: { username },
  });

  if (!user) {
    ctx.throw(404, ctx.$t('errors.user.notFound'));
  }

  ctx.status = 200;
  ctx.body = user;
};

exports.list = async (ctx) => {
  const {
    q: search = '',
    size = 10,
    source = 'fullName,username',
    include: propsToInclude,
  } = ctx.query;

  let select = Object.assign(
    {},
    ...source.split(',').map((field) => ({ [field.trim()]: true })),
  );
  if (source === '*') {
    select = undefined;
  }

  let include;
  if (ctx.state?.user?.isAdmin) {
    include = propsToPrismaInclude(propsToInclude, includableFields);
  }

  const users = await usersService.findMany({
    take: Number.parseInt(size, 10),
    select,
    include,
    where: {
      OR: [
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ],
    },
  });

  ctx.type = 'json';
  ctx.body = users;
};

exports.createOrReplaceUser = async (ctx) => {
  const { username } = ctx.params;
  const { body } = ctx.request;

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

  const importItem = async (itemData = {}) => {
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

  for (let i = 0; i < body.length; i += 1) {
    const userData = body[i] || {};

    try {
      await importItem(userData); // eslint-disable-line no-await-in-loop
    } catch (e) {
      addResponseItem(userData, 'error', e.message);
    }
  }

  ctx.type = 'json';
  ctx.body = response;
};

exports.updateUser = async (ctx) => {
  const { username } = ctx.params;
  const { body } = ctx.request;

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

  const found = !!(await usersService.delete({ where: { username } }));
  appLogger.verbose(`User [${username}] is deleted`);

  ctx.status = 200;
  ctx.body = { found };
};
