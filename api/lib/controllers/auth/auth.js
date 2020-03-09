const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('config');
const elastic = require('../../services/elastic');
const { sendMail, generateMail } = require('../../services/mail');
const { appLogger } = require('../../../server');

const secret = config.get('auth.secret');
const cookie = config.get('auth.cookie');
const sender = config.get('notifications.sender');

exports.renaterLogin = async function (ctx) {
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
    return ctx.throw(400, 'IDP not found in Shibboleth headers');
  }

  if (!props.email) {
    return ctx.throw(400, 'email not found in Shibboleth headers');
  }

  const username = props.email.split('@')[0].toLowerCase();

  let user = await elastic.security.findUser({ username });

  if (!user) {
    ctx.action = 'user/register';
    ctx.metadata = { username };

    props.metadata.createdAt = props.metadata.updatedAt = new Date();
    props.metadata.acceptedTerms = false;
    props.password = await randomString();

    await elastic.security.putUser({ username, body: props });
    user = await elastic.security.findUser({ username });

    if (!user) {
      return ctx.throw(500, 'Failed to save user data');
    }

    try {
      await sendWelcomeMail(user, props.password);
    } catch (err) {
      appLogger.error('Failed to send mail', err);
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
      return ctx.throw(500, 'Failed to update user data');
    }
  } else {
    ctx.action = 'user/connection';
    ctx.metadata = { username };
  }

  ctx.cookies.set(cookie, generateToken(user), { httpOnly: true });
  ctx.redirect(decodeURIComponent(ctx.query.origin || '/'));
};

exports.acceptTerms = async function (ctx) {
  const user = await elastic.security.findUser({ username: ctx.state.user.username });

  if (!user) {
    return ctx.throw(401, 'Unable to fetch user data, please log in again');
  }

  user.metadata.acceptedTerms = true;
  await elastic.security.putUser({ username: user.username, body: user });

  ctx.status = 204;
};

exports.resetPassword = async function (ctx) {
  const user = await elastic.security.findUser({ username: ctx.state.user.username });

  if (!user) {
    return ctx.throw(401, 'Unable to fetch user data, please log in again');
  }

  const newPassword = await randomString();

  await elastic.security.changePassword({
    username: ctx.state.user.username,
    body: {
      password: newPassword,
    },
  });
  await sendNewPassword(ctx.state.user, newPassword);
  ctx.status = 204;
};

exports.getUser = async function (ctx) {
  const user = await elastic.security.findUser({ username: ctx.state.user.username });

  if (!user) {
    return ctx.throw(401, 'Unable to fetch user data, please log in again');
  }

  ctx.status = 200;
  ctx.body = user;
};

exports.getToken = async function (ctx) {
  ctx.status = 200;
  ctx.body = generateToken(ctx.state.user);
};

function generateToken(user) {
  if (!user) { return null; }

  const { username, email } = user;
  return jwt.sign({ username, email }, secret);
}

exports.logout = async function (ctx) {
  ctx.cookies.set('eztoken', null, { httpOnly: true });
  ctx.redirect(decodeURIComponent('/myspace'));
};

function decode(value) {
  if (typeof value !== 'string') { return value; }

  return Buffer.from(value, 'binary').toString('utf8');
}

function randomString() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(5, (err, buffer) => {
      if (err) { return reject(err); }
      resolve(buffer.toString('hex'));
    });
  });
}

function sendWelcomeMail(user, password) {
  return sendMail({
    from: sender,
    to: user.email,
    subject: 'Bienvenue sur ezMESURE !',
    ...generateMail('welcome', { user, password }),
  });
}

function sendNewPassword(user, password) {
  return sendMail({
    from: sender,
    to: user.email,
    subject: 'Votre nouveau mot de passe ezMESURE/Kibana',
    ...generateMail('new-password', { user, password }),
  });
}
