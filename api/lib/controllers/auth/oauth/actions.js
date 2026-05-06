const config = require('config');

const openid = require('../../../utils/openid');
const { signJWE } = require('../../../utils/jwt');

const UsersService = require('../../../entities/users.service');
const { sendWelcomeMail } = require('../mail');
const { appLogger } = require('../../../services/logger');
const { logoutUser, AUTH_COOKIE } = require('../../../services/kibana');
const { createCache } = require('../../../utils/cache-manager');

const { cookie } = config.get('auth');

const loginStateCache = createCache(3600 * 1000);

exports.login = async (ctx) => {
  const {
    url,
    expected,
  } = await openid.buildAuthorizationUrl();

  await loginStateCache.set(
    expected.nonce ? `nonce:${expected.nonce}` : `state:${expected.state}`,
    { expected, query: ctx.query },
  );

  ctx.redirect(url.href);
};

exports.loginCallback = async (ctx) => {
  const stateKey = ctx.query.nonce ? `nonce:${ctx.query.nonce}` : `state:${ctx.query.state}`;

  const state = await loginStateCache.get(stateKey);
  if (!state) {
    ctx.throw(400, 'Invalid state: cannot find expected state');
    return;
  }

  // State is valid, delete it to avoid replay attacks
  await loginStateCache.del(stateKey);

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
    const ezToken = signJWE(
      { username: userProps.username, refreshToken: auth.refresh_token },
      { expiresIn: auth.expires_in },
    );

    ctx.cookies.set(cookie, ezToken, { httpOnly: true });

    ctx.body = {
      refresh_token: !!auth.refresh_token,
      expires_in: auth.expires_in,
      token_type: 'cookie',
    };

    ctx.redirect(decodeURIComponent(state.query.origin || '/'));
  };

  if (state.query.refresh) {
    ctx.action = 'user/refresh';

    userProps.metadata.acceptedTerms = user.metadata.acceptedTerms;

    try {
      await usersService.update({
        where: { username: userProps.username },
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
      where: { username: userProps.username },
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
  let redirectPath = '/';

  // Try to generate a logout url
  try {
    const { url } = await openid.buildEndSessionUrl();
    redirectPath = url.href;
  } catch (err) {
    appLogger.warn(`Failed to end session of ${ctx.state.user.username}: ${err}`);
  }

  // Try to logout from kibana
  try {
    await logoutUser(ctx.cookies.get(AUTH_COOKIE.name));
  } catch (err) {
    appLogger.warn(`Failed to logout from kibana for ${ctx.state.user.username}: ${err}`);
  }

  // Reset cookies anyway to at least logout on app side
  ctx.cookies.set(cookie, '', { httpOnly: true });
  ctx.cookies.set(AUTH_COOKIE.name, '', AUTH_COOKIE.params);
  ctx.redirect(redirectPath);
};

exports.refresh = async (ctx) => {
  const { jwtData, user } = ctx.state;

  if (!jwtData.data.refreshToken) {
    ctx.throw(400, 'Invalid state: no refresh token found');
    return;
  }

  const auth = await openid.refreshTokenGrant(jwtData.data.refreshToken);

  const token = signJWE(
    { username: user.username, refreshToken: auth.refresh_token },
    { expiresIn: auth.expires_in },
  );

  ctx.cookies.set(cookie, token, { httpOnly: true });

  ctx.body = {
    refresh_token: !!auth.refresh_token,
    expires_in: auth.expires_in,
    token_type: 'cookie',
  };
};
