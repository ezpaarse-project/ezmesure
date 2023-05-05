const usersService = require('../../entities/users.service');
const { sendWelcomeMail } = require('../auth/mail');
const { appLogger } = require('../../services/logger');
const { mailDataForPasswordRecovery } = require('../auth/password');

exports.getUser = async (ctx) => {
  const { username } = ctx.params;
  const { user: connectedUser } = ctx.state;

  const { data: user } = await usersService.findUnique({
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

  const { data: users } = await usersService.findMany({
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

  const userExists = !!(await usersService.findUnique({ where: { username } })).data;

  const { data: user, syncMap } = await usersService.upsert({
    where: { username },
    update: { ...body, username },
    create: { ...body, username },
  });
  appLogger.verbose(`User [${user.username}] is upserted`);

  // eslint-disable-next-line no-restricted-syntax
  for (const [service, result] of syncMap) {
    if (result === true) {
      appLogger.verbose(`[${service}] User [${username}] is upserted`);
    } else {
      appLogger.error(`[${service}] User [${username}] cannot be upserted: ${result.message}`);
    }
  }

  ctx.body = user;

  const origin = ctx.get('origin');

  const mailData = mailDataForPasswordRecovery(origin, username);
  const userData = { username, email: body.email };

  if (!userExists) {
    try {
      await sendWelcomeMail(userData, mailData);
    } catch (err) {
      appLogger.error(`Failed to send mail: ${err}`);
    }
  }

  ctx.status = userExists ? 200 : 201;
};

exports.updateUser = async (ctx) => {
  const { username } = ctx.params;
  const { body } = ctx.request;

  const userExists = !!(await usersService.findUnique({ where: { username } })).data;

  if (!userExists) {
    ctx.throw(404, ctx.$t('errors.user.notFound'));
  }

  const { data: user, syncMap } = await usersService.update({
    where: { username },
    data: { ...body, username },
  });
  appLogger.verbose(`User [${username}] is updated`);

  // eslint-disable-next-line no-restricted-syntax
  for (const [service, result] of syncMap) {
    if (result === true) {
      appLogger.verbose(`[${service}] User [${username}] is updated`);
    } else {
      appLogger.error(`[${service}] User [${username}] cannot be updated: ${result.message}`);
    }
  }

  ctx.body = user;
  ctx.status = 200;
};

exports.deleteUser = async (ctx) => {
  const { username } = ctx.request.params;

  const { data, syncMap } = await usersService.delete({ where: { username } });
  appLogger.verbose(`User [${username}] is deleted`);

  // eslint-disable-next-line no-restricted-syntax
  for (const [service, result] of syncMap) {
    if (result === true) {
      appLogger.verbose(`[${service}] User [${username}] is deleted`);
    } else {
      appLogger.error(`[${service}] User [${username}] cannot be deleted: ${result.message}`);
    }
  }

  ctx.status = 200;
  ctx.body = { found: !!data };
};
