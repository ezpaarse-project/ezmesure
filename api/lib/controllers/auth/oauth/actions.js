const config = require('config');

const openid = require('../../../utils/openid');

const UsersService = require('../../../entities/users.service');
const { sendWelcomeMail } = require('../mail');
const { appLogger } = require('../../../services/logger');

const cookie = config.get('auth.cookie');

const loginState = new Map();

exports.login = async (ctx) => {
  const {
    url,
    expected,
  } = await openid.buildAuthorizationUrl();

  loginState.set(
    expected.nonce ? `nonce:${expected.nonce}` : `state:${expected.state}`,
    { expected, query: ctx.query },
  );

  ctx.redirect(url.href);
};

exports.loginCallback = async (ctx) => {
  const stateKey = ctx.query.nonce ? `nonce:${ctx.query.nonce}` : `state:${ctx.query.state}`;

  const state = loginState.get(stateKey);
  if (!state) {
    ctx.throw(400, 'Invalid state: cannot find expected state');
    return;
  }

  // State is valid, delete it to avoid replay attacks
  loginState.delete(stateKey);

  // ctx.href may be unaware of the proxy
  // so we use the expected "redirectURL" and append the query parameters
  const currentURL = new URL(ctx.href);
  const expectedURL = new URL(openid.redirectURL);
  expectedURL.search = currentURL.search;

  const auth = await openid.authorizationCodeGrant(expectedURL, state.expected);

  const userProps = openid.getUserFromInfo(
    await openid.getUserInfo(auth.access_token, auth.claims()?.sub || ''),
  );

  ctx.metadata = { username: userProps.username };
  const usersService = new UsersService();
  let user = await usersService.findUnique({ where: { username: userProps.username } });

  const next = () => {
    ctx.cookies.set(cookie, auth.access_token, { httpOnly: true });
    ctx.body = auth;
    ctx.redirect(decodeURIComponent(state.query.origin || '/'));
  };

  if (state.query.refresh) {
    ctx.action = 'user/refresh';

    userProps.metadata.acceptedTerms = user.metadata.acceptedTerms;

    try {
      await usersService.update({
        where: { username: user.username },
        data: userProps,
      });
      appLogger.info(`User [${user.username}] is updated`);
    } catch (err) {
      appLogger.error(`User [${user.username}] cannot be updated: ${err.message}`);
      ctx.throw(500, err);
      return;
    }

    next();
    return;
  }

  if (user) {
    ctx.action = 'user/connection';

    await usersService.update({
      where: { username: user.username },
      data: { deletedAt: null },
    });

    next();
    return;
  }

  ctx.action = 'user/register';

  userProps.metadata.acceptedTerms = false;

  user = await usersService.create({ data: userProps });

  try {
    await sendWelcomeMail(user);
  } catch (err) {
    appLogger.error(`Failed to send mail: ${err}`);
  }
  next();
};

exports.logout = async (ctx) => {
  try {
    await openid.revokeUserToken(ctx.state.jwtData.token);
  } catch (err) {
    appLogger.error(`Failed to revoke token for ${ctx.state.user.username}: ${err}`);
  }

  ctx.cookies.set(cookie, '', { httpOnly: true });
  ctx.redirect(decodeURIComponent(ctx.query.origin || '/'));
};
