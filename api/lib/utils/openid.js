// @ts-check

const nodeConfig = require('config');
const openid = require('openid-client');

const config = nodeConfig.get('auth.oidc');

const redirectURL = new URL('/api/auth/oauth/login/callback', nodeConfig.get('publicUrl'));

const IS_OAUTH2 = true; // TODO: Find out if the OIDC provider supports OAuth2

/**
 * @typedef {{ code: string, state?: string, nonce?: string }} ExpectedCallbackData
 */

/** @type {openid.Configuration | undefined} */
let oidcConfig;

/**
 * Get OIDC configuration using cache or app config
 *
 * @returns {Promise<openid.Configuration>}
 */
async function getOIDCConfig() {
  if (oidcConfig) {
    return oidcConfig;
  }

  if (!config.uris.discovery) {
    oidcConfig = new openid.Configuration(
      {
        issuer: config.uris.issuer,
        authorization_endpoint: config.uris.authorization,
        token_endpoint: config.uris.token,
        userinfo_endpoint: config.uris.userinfo,
        revocation_endpoint: config.uris.revocation,
      },
      config.client.id,
      { client_secret: config.client.secret },
    );
    return oidcConfig;
  }

  oidcConfig = await openid.discovery(
    new URL(config.uris.discovery),
    config.client.id,
    { client_secret: config.client.secret },
  );
  return oidcConfig;
}

module.exports.redirectURL = redirectURL;

/**
 * Build authorization URL using OIDC configuration
 *
 * @returns {Promise<{ url: URL, expected: ExpectedCallbackData }>}
 */
module.exports.buildAuthorizationUrl = async () => {
  const oidc = await getOIDCConfig();

  const codeVerifier = openid.randomPKCECodeVerifier();
  const codeChallenge = await openid.calculatePKCECodeChallenge(codeVerifier);

  /** @type {'state' | 'nonce'} */
  let stateKey;
  /** @type {string} */
  let state;

  if (IS_OAUTH2) {
    stateKey = 'state';
    state = openid.randomState();
  } else {
    stateKey = 'nonce';
    state = openid.randomNonce();
  }

  const parameters = {
    // Route to the callback handler
    redirect_uri: redirectURL.href,
    scope: config.scopes.join(' '),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    [stateKey]: state,
  };

  return {
    url: openid.buildAuthorizationUrl(oidc, parameters),
    expected: {
      code: codeVerifier,
      [stateKey]: state,
    },
  };
};

/**
 * Get access token using authorization code grant
 *
 * @param {URL} url - Current callback URL (with query parameters)
 * @param {ExpectedCallbackData} expected - Expected data
 *
 * @returns {Promise<openid.TokenEndpointResponse & openid.TokenEndpointResponseHelpers>}
 */
module.exports.authorizationCodeGrant = async (url, expected) => {
  const oidc = await getOIDCConfig();

  return openid.authorizationCodeGrant(
    oidc,
    url,
    {
      pkceCodeVerifier: expected.code,
      expectedState: expected.state,
      expectedNonce: expected.nonce,
      idTokenExpected: expected.nonce ? true : undefined,
    },
  );
};

/**
 * Get user info using access token
 *
 * @param {string} accessToken - The access token
 * @param {string} subject - The subject
 *
 * @returns {Promise<openid.UserInfoResponse>}
 */
module.exports.getUserInfo = async (accessToken, subject) => {
  const oidc = await getOIDCConfig();

  return openid.fetchUserInfo(oidc, accessToken, subject);
};

/**
 * Get user from openid UserInfo
 *
 * @param {openid.UserInfoResponse} userInfo
 *
 * @returns {Omit<import('@prisma/client').User, 'createdAt' | 'updatedAt' | 'lastActivity'>}
 */
module.exports.getUserFromInfo = (userInfo) => {
  if (!userInfo.email) {
    throw new Error('No suitable email found');
  }

  let username = userInfo.preferred_username;
  if (!username) {
    username = userInfo.email.split('@')[0].toLowerCase();
  }

  let fullName = userInfo.name;
  if (!fullName && userInfo.given_name && userInfo.family_name) {
    fullName = `${userInfo.given_name} ${userInfo.family_name}`;
  }

  return {
    username,
    fullName: fullName || username,
    email: userInfo.email,
    isAdmin: false,
    metadata: {
      uid: userInfo.sub,
      idp: userInfo.idp,
      org: userInfo.organisation,
      unit: userInfo.unit,
    },
  };
};

/**
 * Get info about access token
 *
 * @param {string} accessToken  - The access token
 *
 * @returns {Promise<openid.IntrospectionResponse>}
 */
module.exports.getTokenInfo = async (accessToken) => {
  const oidc = await getOIDCConfig();

  return openid.tokenIntrospection(oidc, accessToken);
};

/**
 * Get info about access token
 *
 * @param {string} accessToken  - The access token
 *
 * @returns {Promise<void>}
 */
module.exports.revokeUserToken = async (accessToken) => {
  const oidc = await getOIDCConfig();

  return openid.tokenRevocation(oidc, accessToken);
};
