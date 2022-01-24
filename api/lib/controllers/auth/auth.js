const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('config');
const {
  addHours, differenceInHours, isBefore, parseISO,
} = require('date-fns');
const elastic = require('../../services/elastic');
const { sendMail, generateMail } = require('../../services/mail');
const { appLogger } = require('../../services/logger');

const secret = config.get('auth.secret');
const cookie = config.get('auth.cookie');
const sender = config.get('notifications.sender');

function generateToken(user) {
  if (!user) { return null; }

  const { username, email } = user;
  return jwt.sign({ username, email }, secret);
}

function decode(value) {
  if (typeof value !== 'string') { return value; }

  return Buffer.from(value, 'binary').toString('utf8');
}

function randomString() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(5, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer.toString('hex'));
      }
    });
  });
}

function sendWelcomeMail(user) {
  return sendMail({
    from: sender,
    to: user.email,
    subject: 'Bienvenue sur ezMESURE !',
    ...generateMail('welcome', { user }),
  });
}

function sendPasswordRecovery(user, data) {
  return sendMail({
    from: sender,
    to: user.email,
    subject: 'Réinitialisation mot de passe ezMESURE/Kibana',
    ...generateMail('new-password', { user, ...data }),
  });
}

exports.renaterLogin = async (ctx) => {
  const { query } = ctx.request;
  const headers = ctx.request.header;
  const props = {
    full_name: decode(headers.displayname || headers.cn || headers.givenname),
    email: decode(headers.mail),
    roles: ['new_user'],
    metadata: {
      idp: headers['shib-identity-provider'],
      uid: headers.uid,
      org: decode(headers.o),
      unit: decode(headers.ou),
      eppn: headers.eppn,
      remoteUser: headers.remote_user,
      persistentId: headers['persistent-id'] || headers['targeted-id'],
      affiliation: headers.affiliation,
    },
  };

  if (!props.metadata.idp) {
    ctx.throw(400, ctx.$t('errors.auth.IDPNotFound'));
    return;
  }

  if (!props.email) {
    ctx.throw(400, ctx.$t('errors.auth.noEmailInHeaders'));
    return;
  }

  const username = props.email.split('@')[0].toLowerCase();

  let user = await elastic.security.findUser({ username });

  if (!user) {
    ctx.action = 'user/register';
    ctx.metadata = { username };

    const now = new Date();
    props.metadata.createdAt = now;
    props.metadata.updatedAt = now;
    props.metadata.acceptedTerms = false;
    props.password = await randomString();

    await elastic.security.putUser({ username, body: props });
    user = await elastic.security.findUser({ username });

    if (!user) {
      ctx.throw(500, ctx.$t('errors.user.failedToSave'));
      return;
    }

    try {
      await sendWelcomeMail(user);
    } catch (err) {
      appLogger.error(`Failed to send mail: ${err}`);
    }
  } else if (query.refresh) {
    ctx.action = 'user/refresh';
    ctx.metadata = { username };

    props.metadata.updatedAt = new Date();
    props.metadata.createdAt = user.metadata.createdAt;
    props.metadata.acceptedTerms = !!user.metadata.acceptedTerms;
    props.roles = user.roles;
    props.username = username;

    try {
      await elastic.security.putUser({ username, body: props });
      user = props;
    } catch (e) {
      ctx.throw(500, ctx.$t('errors.user.failedToSave'));
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

  if (user.metadata && user.metadata._reserved) {
    ctx.throw(403, ctx.$t('errors.auth.reservedUser'));
    return;
  }

  ctx.cookies.set(cookie, generateToken(user), { httpOnly: true });
  ctx.body = user;
  ctx.status = 200;
};

exports.acceptTerms = async (ctx) => {
  const user = await elastic.security.findUser({ username: ctx.state.user.username });

  if (!user) {
    ctx.throw(401, ctx.$t('errors.auth.unableToFetchUser'));
    return;
  }

  user.metadata.acceptedTerms = true;
  await elastic.security.putUser({ username: user.username, body: user });

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
  const user = await elastic.security.findUser({ username: ctx.state.user.username });

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

exports.logout = async (ctx) => {
  ctx.cookies.set(cookie, null, { httpOnly: true });
  ctx.redirect(decodeURIComponent('/myspace'));
};
