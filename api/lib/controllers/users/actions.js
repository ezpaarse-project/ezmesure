const usersService = require('../../entities/users.service');

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
  const { user } = ctx.state;

  const {
    q: search = '',
    size = 10,
    source = 'fullName,username',
  } = ctx.query;

  if (source !== 'fullName,username' && !user.isAdmin) {
    ctx.throw(403, ctx.$t('errors.perms.feature'));
  }

  let select = Object.assign(
    {},
    ...source.split(',').map((field) => ({ [field.trim()]: true })),
  );
  if (source === '*') {
    select = undefined;
  }

  const users = await usersService.findMany({
    take: Number.parseInt(size, 10),
    select,
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

  const userExists = !!await usersService.findUnique({ where: { username } });

  ctx.body = await usersService.upsert({
    where: { username },
    update: { ...body, username },
    create: { ...body, username },
  });

  const users = body.hits && body.hits.hits;

  if (!Array.isArray(users)) {
    ctx.throw(500, ctx.$t('errors.users.failedToQuery'));
  }

  ctx.status = userExists ? 200 : 201;
};

exports.updateUser = async (ctx) => {
  const { username } = ctx.params;
  const { body } = ctx.request;

  const userExists = !!await usersService.findUnique({ where: { username } });

  if (!userExists) {
    ctx.throw(404, ctx.$t('errors.user.notFound'));
  }

  ctx.body = await usersService.update({
    where: { username },
    data: { ...body, username },
  });

  ctx.status = 200;
};

exports.deleteUser = async (ctx) => {
  const { username } = ctx.request.params;

  const found = !!await usersService.delete({ where: { username } });

  ctx.status = 200;
  ctx.body = { found };
};
