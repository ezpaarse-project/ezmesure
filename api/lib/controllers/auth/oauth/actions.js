const config = require('config');

const openid = require('../../../utils/openid');
const { signJWE } = require('../../../utils/jwt');

const UsersService = require('../../../entities/users.service');
const { sendWelcomeMail } = require('../mail');
const { appLogger } = require('../../../services/logger');
const { logoutUser, AUTH_COOKIE } = require('../../../services/kibana');
const { createCache } = require('../../../utils/cache-manager');

const { cookie } = config.get('auth');

const loginStateCache = createCache(config.get('cache.duration.loginState'));

const logoutFromKibana = async (ctx) => {
  try {
    await logoutUser(ctx.cookies.get(AUTH_COOKIE.name));
  } catch (err) {
    appLogger.warn(`Failed to logout from kibana for ${ctx.state.user?.username ?? 'unknown'}: ${err}`);
  }

  // Reset cookie on client side
  ctx.cookies.set(AUTH_COOKIE.name, '', AUTH_COOKIE.params);
};

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
  let user = await UsersService.$transaction(async (users) => {
    const byId = await users.findFirst({ where: { id: userProps.id } });
    return byId || users.findUnique({
      where: { accountLinked: false, username: userProps.username },
    });
  });

  // Tries to logout previous sessions from Kibana
  await logoutFromKibana(ctx);

  const ezToken = await signJWE(
    { id: userProps.id, refreshToken: auth.refresh_token },
    { expiresIn: auth.expires_in },
  );

  const next = () => {
    ctx.cookies.set(cookie, ezToken, { httpOnly: true });

    ctx.body = {
      refresh_token: !!auth.refresh_token,
      expires_in: auth.expires_in,
      token_type: 'cookie',
    };

    ctx.redirect(decodeURIComponent(state.query.origin || '/'));
  };

  const usersService = new UsersService();

  if (user) {
    ctx.action = 'user/connection';

    await usersService.update({
      where: { id: user.id },
      data: {
        ...userProps,
        // Don't change options specified by user
        excludeNotifications: user.excludeNotifications,
        language: user.language,
        // Migrate acceptedTerms from metadata
        acceptedTerms: user.metadata?.acceptedTerms || user.acceptedTerms,
      },
    });

    next();
    return;
  }

  ctx.action = 'user/register';

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
  await logoutFromKibana(ctx);

  // Reset cookies anyway to at least logout on app side
  ctx.cookies.set(cookie, '', { httpOnly: true });
  ctx.redirect(redirectPath);
};

exports.refresh = async (ctx) => {
  const { user, jwtData } = ctx.state;

  // Use refresh token from JWT payload
  if (jwtData.data.refreshToken) {
    const auth = await openid.refreshTokenGrant(jwtData.data.refreshToken);

    const ezToken = await signJWE(
      { id: user.id, refreshToken: auth.refresh_token },
      { expiresIn: auth.expires_in },
    );

    ctx.cookies.set(cookie, ezToken, { httpOnly: true });
    ctx.body = {
      refresh_token: !!auth.refresh_token,
      expires_in: auth.expires_in,
      token_type: 'cookie',
    };

    return;
  }

  // Don't extend impersonating duration but don't throw error until expired
  const expiresInMs = jwtData.data.exp - Date.now();
  if (jwtData.data.impersonatedBy && expiresInMs >= 1000) {
    ctx.body = {
      refresh_token: true,
      expires_in: Math.floor(expiresInMs / 1000),
      token_type: 'cookie',
    };

    return;
  }

  // Unable to refresh session
  ctx.throw(400, 'Invalid state: no refresh method found');
};
