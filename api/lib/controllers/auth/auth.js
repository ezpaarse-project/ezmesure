const jwt = require('jsonwebtoken');
const config = require('config');
const { addHours, isBefore, parseISO } = require('date-fns');
const elastic = require('../../services/elastic');
const ezrUsers = require('../../services/ezreeport/users');
const usersService = require('../../entities/users.service');
const membershipsService = require('../../entities/memberships.service');
const { appLogger } = require('../../services/logger');
const { sendWelcomeMail, sendPasswordRecovery, sendNewUserToContacts } = require('./mail');

const secret = config.get('auth.secret');
const cookie = config.get('auth.cookie');

function generateToken(user) {
  if (!user) { return null; }

  const { username, email } = user;
  return jwt.sign({ username, email }, secret);
}

function decode(value) {
  if (typeof value !== 'string') { return value; }

  return Buffer.from(value, 'binary').toString('utf8');
}

exports.getReportingToken = async (ctx) => {
  const token = await ezrUsers.getToken(ctx?.state?.user?.username);
  ctx.body = { token };
};

exports.renaterLogin = async (ctx) => {
  const { query } = ctx.request;
  const headers = ctx.request.header;

  const email = decode(headers.mail);
  const idp = headers['shib-identity-provider'];

  if (!idp) {
    ctx.throw(400, ctx.$t('errors.auth.IDPNotFound'));
    return;
  }

  if (!email) {
    ctx.throw(400, ctx.$t('errors.auth.noEmailInHeaders'));
    return;
  }

  const userProps = {
    username: email.split('@')[0].toLowerCase(),
    fullName: decode(headers.displayname || headers.cn || headers.givenname),
    email,
    metadata: {
      idp,
      uid: headers.uid,
      org: decode(headers.o),
      unit: decode(headers.ou),
      eppn: headers.eppn,
      remoteUser: headers.remote_user,
      persistentId: headers['persistent-id'] || headers['targeted-id'],
      affiliation: headers.affiliation,
    },
  };

  const { username } = userProps;

  let user = await usersService.findUnique({ where: { username } });

  if (!user) {
    ctx.action = 'user/register';
    ctx.metadata = { username };

    userProps.metadata.acceptedTerms = false;

    // First create the user
    user = await usersService.create({ data: userProps });

    try {
      await sendWelcomeMail(user);
    } catch (err) {
      appLogger.error(`Failed to send mail: ${err}`);
    }
  } else if (query.refresh) {
    ctx.action = 'user/refresh';
    ctx.metadata = { username };

    userProps.metadata.acceptedTerms = !!user.metadata.acceptedTerms;

    try {
      await usersService.update({
        where: { username },
        data: userProps,
      });
      appLogger.info(`User [${user.username}] is updated`);
    } catch (err) {
      appLogger.error(`User [${user.username}] cannot be updated: ${err.message}`);
      ctx.throw(500, err);
      return;
    }
  } else {
    ctx.action = 'user/connection';
    ctx.metadata = { username };
  }

  ctx.cookies.set(cookie, generateToken(user), { httpOnly: true });
  ctx.redirect(decodeURIComponent(ctx.query.origin || '/'));
};

exports.elasticLogin = async (ctx) => {
  ctx.action = 'user/connection';

  const { username, password } = ctx.request.body;
  const basicString = Buffer.from(`${username}:${password}`).toString('base64');
  let user;

  try {
    const response = await elastic.security.authenticate({}, {
      headers: {
        authorization: `Basic ${basicString}`,
      },
    });
    user = response && response.body;
  } catch (e) {
    ctx.throw(e.statusCode || 500, e.message);
    return;
  }

  if (!user) {
    ctx.throw(401);
    return;
  }

  // eslint-disable-next-line no-underscore-dangle
  if (user.metadata && user.metadata._reserved) {
    ctx.throw(403, ctx.$t('errors.auth.reservedUser'));
    return;
  }

  // Make sure that the user exists in the DB
  await usersService.upsert({
    where: { username },
    update: {},
    create: {
      username,
      email: user.email,
      fullName: user.full_name,
      isAdmin: user.roles?.includes?.('superuser'),
    },
  });
  appLogger.verbose(`User [${username}] is upserted`);

  ctx.metadata = { username };
  ctx.cookies.set(cookie, generateToken(user), { httpOnly: true });
  ctx.body = user;
  ctx.status = 200;
};

exports.acceptTerms = async (ctx) => {
  const { user } = ctx.state;
  const { email, username } = user;

  if (user?.metadata?.acceptTerms === true) {
    ctx.status = 204;
    return;
  }

  try {
    await usersService.acceptTerms(username);
  } catch (err) {
    ctx.status = 500;
    appLogger.error(`Failed to update user: ${err}`);
    return;
  }

  const origin = ctx.get('origin');
  const [, domain] = email.split('@');

  let correspondents;
  try {
    correspondents = await usersService.findEmailOfCorrespondentsWithDomain(domain);
  } catch (err) {
    appLogger.error(`Failed to get collaborators of new user: ${err}`);
  }

  if (Array.isArray(correspondents) && correspondents.length > 0) {
    const emails = correspondents.map((c) => c?.email).filter((x) => x);

    try {
      await sendNewUserToContacts(emails, {
        manageMemberLink: `${origin}/institutions/self/members`,
        newUser: user.username,
      });
    } catch (err) {
      appLogger.error(`Failed to send mail: ${err}`);
    }
  }

  ctx.status = 204;
};

exports.getResetToken = async (ctx) => {
  const { body } = ctx.request;

  const username = body.username || ctx.state.user.username;

  const user = await elastic.security.findUser({ username });

  if (!user) {
    ctx.throw(404, ctx.$t('errors.auth.noUserFound'));
    return;
  }

  const origin = ctx.get('origin');

  const currentDate = new Date();
  const expiresAt = addHours(currentDate, config.passwordResetValidity);
  const token = jwt.sign({
    username: user.username,
    createdAt: currentDate,
    expiresAt,
  }, secret);

  const diffInHours = config.get('passwordResetValidity');
  await sendPasswordRecovery(user, {
    recoveryLink: `${origin}/password/new?token=${token}`,
    resetLink: `${origin}/password/reset`,
    validity: `${diffInHours} heure${diffInHours > 1 ? 's' : ''}`,
  });

  ctx.status = 204;
};

exports.resetPassword = async (ctx) => {
  const { token, password } = ctx.request.body;

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (err) {
    ctx.throw(400, ctx.$t('errors.password.invalidToken'));
    return;
  }

  const { username, expiresAt, createdAt } = decoded;

  let tokenIsValid = isBefore(new Date(), parseISO(expiresAt));
  if (!tokenIsValid) {
    ctx.throw(400, ctx.$t('errors.password.expires'));
    return;
  }

  const user = await elastic.security.findUser({ username });
  if (!user) {
    ctx.throw(404, ctx.$t('errors.auth.noUserFound'));
    return;
  }

  if (user && user.metadata && user.metadata.passwordDate) {
    tokenIsValid = isBefore(parseISO(user.metadata.passwordDate), parseISO(createdAt));

    if (!tokenIsValid) {
      ctx.throw(404, ctx.$t('errors.password.expires'));
      return;
    }
  }

  await elastic.security.changePassword({
    username,
    body: {
      password,
    },
  });

  user.metadata.passwordDate = new Date();
  user.password = password;
  await elastic.security.putUser({ username, body: user });

  ctx.status = 204;
};

exports.changePassword = async (ctx) => {
  const { body } = ctx.request;
  const { password } = body;

  const user = await elastic.security.findUser({ username: ctx.state.user.username });

  if (!user) {
    ctx.throw(401, ctx.$t('errors.auth.unableToFetchUser'));
    return;
  }

  await elastic.security.changePassword({
    username: ctx.state.user.username,
    body: {
      password,
    },
  });

  ctx.status = 204;
};

exports.getUser = async (ctx) => {
  const user = await usersService.findUnique({
    where: { username: ctx.state.user.username },
    include: { memberships: true },
  });

  if (!user) {
    ctx.throw(401, ctx.$t('errors.auth.unableToFetchUser'));
    return;
  }

  ctx.status = 200;
  ctx.body = user;
};

exports.getToken = async (ctx) => {
  ctx.status = 200;
  ctx.body = generateToken(ctx.state.user);
};

exports.getMemberships = async (ctx) => {
  const { username } = ctx.state.user;
  ctx.status = 200;
  ctx.body = await membershipsService.findMany({
    where: { username },
    include: { institution: true },
  });
};

exports.logout = async (ctx) => {
  ctx.cookies.set(cookie, null, { httpOnly: true });
  ctx.redirect(decodeURIComponent('/myspace'));
};
