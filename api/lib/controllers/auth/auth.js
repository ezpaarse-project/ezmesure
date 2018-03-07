const crypto = require('crypto');
const jwt = require('koa-jwt');
const config = require('config');
const notifications = require('../../services/notifications');
const elastic = require('../../services/elastic');
const sendMail = require('../../services/mail');
const { appLogger } = require('../../../server');

const secret = config.get('auth.secret');
const sender = config.get('notifications.sender');

exports.renaterLogin = async function (ctx) {
  const query   = ctx.request.query;
  const headers = ctx.request.header;
  const props   = {
    full_name: decode(headers.displayname || headers.cn || headers.givenname),
    email:     decode(headers.mail),
    roles: ['kibana_dashboard_only_user'],
    metadata: {
      idp:          headers['shib-identity-provider'],
      uid:          headers.uid,
      org:          decode(headers.o),
      unit:         decode(headers.ou),
      eppn:         headers.eppn,
      remoteUser:   headers.remote_user,
      persistentId: headers['persistent-id'] || headers['targeted-id'],
      affiliation:  headers.affiliation
    }
  };

  if (!props.metadata.idp) {
    return ctx.throw('IDP not found in Shibboleth headers', 400);
  }

  if (!props.email) {
    return ctx.throw('email not found in Shibboleth headers', 400);
  }

  const username = props.email.split('@')[0].toLowerCase();

  let user = await elastic.findUser(username);

  if (!user) {
    props.metadata.createdAt = props.metadata.updatedAt = new Date();
    props.password = await randomString();

    await elastic.updateUser(username, props);
    user = await elastic.findUser(username);

    if (!user) {
      return ctx.throw('Failed to save user data', 500);
    }

    notifications.newUser(user);

    try {
      await sendWelcomeMail(user, props.password);
    } catch (err) {
      appLogger.error('Failed to send mail', err);
    }
  } else if (query.refresh) {
    props.metadata.updatedAt = new Date();
    props.metadata.createdAt = user.metadata.createdAt;
    props.username           = username;

    try {
      await elastic.updateUser(username, props);
      user = props;
    } catch (e) {
      return ctx.throw('Failed to update user data', 500);
    }
  }

  ctx.cookies.set('eztoken', generateToken(user), { httpOnly: true });
  ctx.redirect(decodeURIComponent(ctx.query.origin || '/'));
};

exports.resetPassword = async function (ctx) {
  const user = await elastic.findUser(ctx.state.user.username);

  if (!user) {
    return ctx.throw('Unable to fetch user data, please log in again', 401);
  }

  const newPassword = await randomString();

  await elastic.updateUserPassword(ctx.state.user.username, newPassword);
  await sendNewPassword(user, newPassword);
  ctx.status = 204;
}

exports.getUser = async function (ctx) {
  const user = await elastic.findUser(ctx.state.user.username);

  if (!user) {
    return ctx.throw('Unable to fetch user data, please log in again', 401);
  }

  ctx.status = 200;
  ctx.body   = user;
};

exports.getToken = async function (ctx) {
  ctx.status = 200;
  ctx.body   = generateToken(ctx.state.user);
};

function generateToken(user) {
  if (!user) { return null; }

  const { username, email } = user;
  return jwt.sign({ username, email }, secret);
}

function decode(value) {
  if (typeof value !== 'string') { return value; }

  return Buffer.from(value, 'binary').toString('utf8');
}

function randomString () {
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
    text: `
      Bienvenue ${user.full_name},
      Vous êtes à présent enregistré sur ezMESURE. Les identifiants suivants vous seront demandés afin d'accéder aux tableaux de bord :

      Nom d'utilisateur: ${user.username}
      Mot de passe: ${password}

      Par souci de sécurité, nous vous invitons à changer rapidement votre mot de passe en accédant à votre compte via l'interface Kibana.
      Si ce n'est pas déjà fait, nous vous invitons également à vous rapprocher de l'équipe afin de déterminer vos droits d'accès, sans quoi vous ne pourrez visualiser vos données.

      Cordialement,
      L'équipe ezMESURE.
    `,
    html: `
      <h1>Bienvenue ${user.full_name},</h1>
      <p>Vous êtes à présent enregistré sur ezMESURE. Les identifiants suivants vous seront demandés afin d'accéder aux tableaux de bord :</p>
      <table>
        <tbody>
          <tr>
            <td><strong>Nom d'utilisateur</strong></td>
            <td>${user.username}</td>
          </tr>
          <tr>
            <td><strong>Mot de passe</strong></td>
            <td>${password}</td>
          </tr>
        </tbody>
      </table>
      <p>Par souci de sécurité, nous vous invitons à changer rapidement votre mot de passe en accédant à votre compte via l'interface Kibana.</p>
      <p>Si ce n'est pas déjà fait, nous vous invitons également à vous rapprocher de l'équipe afin de déterminer vos droits d'accès, sans quoi vous ne pourrez visualiser vos données.</p>
      <p>Cordialement,</p>
      <p>L'équipe ezMESURE.</p>
    `
  });
}

function sendNewPassword(user, password) {
  return sendMail({
    from: sender,
    to: user.email,
    subject: 'Votre nouveau mot de passe ezMESURE/Kibana',
    text: `
      Bonjour ${user.full_name},
      Votre mot de passe ezMESURE/Kibana a été réinitialisé. Voici vos nouveaux identifiants Kibana :

      Nom d'utilisateur: ${user.username}
      Mot de passe: ${password}

      Par souci de sécurité, nous vous invitons à changer rapidement votre mot de passe en accédant à votre compte via l'interface Kibana.

      Cordialement,
      L'équipe ezMESURE.
    `,
    html: `
      <h1>Bonjour ${user.full_name},</h1>
      <p>Votre mot de passe a été réinitialisé. Voici vos nouveaux identifiants Kibana :</p>
      <table>
        <tbody>
          <tr>
            <td><strong>Nom d'utilisateur</strong></td>
            <td>${user.username}</td>
          </tr>
          <tr>
            <td><strong>Mot de passe</strong></td>
            <td>${password}</td>
          </tr>
        </tbody>
      </table>
      <p>Par souci de sécurité, nous vous invitons à changer rapidement votre mot de passe en accédant à votre compte via l'interface Kibana.</p>
      <p>Cordialement,</p>
      <p>L'équipe ezMESURE.</p>
    `
  });
}
