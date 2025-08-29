const { auth } = require('config');
const jwt = require('jsonwebtoken');
const { isAfter } = require('date-fns');

const openid = require('../utils/openid');

const InstitutionsService = require('../entities/institutions.service');
const SushiEndpointService = require('../entities/sushi-endpoints.service');
const SushiCredentialsService = require('../entities/sushi-credentials.service');
const UsersService = require('../entities/users.service');
const RepositoriesService = require('../entities/repositories.service');
const RepositoryAliasesService = require('../entities/repository-aliases.service');
const SpacesService = require('../entities/spaces.service');
const ApiKeysService = require('../entities/api-key.service');

const { triggerHooks } = require('../hooks/hookEmitter');

const { MEMBER_ROLES } = require('../entities/memberships.dto');

const { appLogger } = require('./logger');

/**
 * @typedef {KoaContext} KoaContext
 * @typedef {KoaNext} KoaNext
 * @typedef {import('openid-client').IntrospectionResponse} IntrospectionResponse
 * @typedef {import('jsonwebtoken').JwtPayload} JwtPayload
 * @typedef {import('@prisma/client').ApiKey} ApiKey
 * @typedef {import('@prisma/client').User} User
 * @typedef {import('@prisma/client').Institution} Institution
 */

const { DOC_CONTACT, TECH_CONTACT } = MEMBER_ROLES;

/**
 * Get auth data of cookie using OpenID provider
 *
 * @param {string} cookie - The cookie found in request
 *
 * @returns {Promise<{ type: 'oauth', token: string, data: IntrospectionResponse }>}
 */
async function getAuthDataFromCookie(cookie) {
  let data;

  try {
    data = await openid.getTokenInfo(cookie);
  } catch {
    throw new Error("Can't get token");
  }

  if (!data.active) {
    throw new Error('Token is revoked');
  }

  return {
    type: 'oauth',
    token: cookie,
    data,
  };
}

/**
 * Get auth data of header using JWT methods
 *
 * @param {string} header - The header found in request
 *
 * @returns {Promise<{ type: 'old_jwt', token: string, data: JwtPayload }>}
 */
function getAuthDataFromAuthHeader(header) {
  const matches = /Bearer (?<token>.+)/i.exec(header);
  const { token } = matches.groups ?? {};
  if (!token) {
    throw new Error("Can't get token");
  }

  return new Promise((resolve, reject) => {
    jwt.verify(token, auth.secret, {}, (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      resolve({
        type: 'old_jwt',
        token,
        data,
      });
    });
  });
}

/**
 * Get auth data of header using API Key
 *
 * @param {string} header - The header found in request
 *
 * @returns {Promise<{ type: 'api_key', token: string, data: ApiKey }>}
 */
async function getAuthDataFromApiHeader(header) {
  const hash = ApiKeysService.getHashValue(header);

  const service = new ApiKeysService();
  const data = await service.findUnique({ where: { value: hash } });

  if (!data) {
    throw new Error("Can't get API key");
  }

  if (!data.active) {
    throw new Error('API key is revoked');
  }

  if (data.expiresAt && isAfter(new Date(), data.expiresAt)) {
    throw new Error('API key is expired');
  }

  return {
    type: 'api_key',
    token: hash,
    data,
  };
}

/**
 * Check if request have a valid auth
 *
 * @param {KoaContext} ctx - Koa context
 * @param {KoaNext} next - Next handler
 */
const requireAuth = async (ctx, next) => {
  let authData = {};

  try {
    // Check if a OAuth token is present
    const cookie = ctx.cookies.get(auth.cookie);
    if (cookie) {
      authData = await getAuthDataFromCookie(cookie);
    }

    // Check if a deprecated JWT token is present
    const authHeader = ctx.get('authorization');
    if (authHeader) {
      authData = await getAuthDataFromAuthHeader(authHeader);
    }

    // Check if an API Key is present
    const apikeyHeader = ctx.get('x-api-key');
    if (apikeyHeader) {
      authData = await getAuthDataFromApiHeader(apikeyHeader);
    }
  } catch (err) {
    appLogger.warn(`[auth] Couldn't get auth data: ${err}`);
    ctx.throw(401, ctx.$t('errors.auth.unableToFetchUser'));
    return;
  }

  if (!authData.token || !authData.data) {
    ctx.throw(401, ctx.$t('errors.auth.unableToFetchUser'));
    return;
  }

  ctx.state.authData = authData;
  await next();
};

/**
 * Get username from OAuth (using OpenID provider)
 *
 * @param {string} token - The token found in request
 * @param {IntrospectionResponse} data - The data of the token
 *
 * @returns {Promise<string>} - The username found in data
 */
async function getUsernameFromOAuth(token, data) {
  const userProps = openid.getUserFromInfo(
    await openid.getUserInfo(token, data.sub),
  );

  return userProps.username;
}

/**
 * Get username from old jwt
 *
 * @param {string} token - The token found in request
 * @param {JwtPayload} data - The data of the token
 *
 * @returns {Promise<string>} - The username found in data. Returns a promise to be uniform.
 */
function getUsernameFromOldJWT(token, data) {
  return Promise.resolve(data.username);
}

/**
 * Get username from api key
 *
 * @param {string} token - The token found in request
 * @param {ApiKey} data - The data of the token
 *
 * @returns {Promise<string>} - The username found in data. Returns a promise to be uniform.
 */
function getUsernameFromApiKey(token, data) {
  if (data.institutionId) {
    return Promise.reject(Error('API key is scoped to an institution'));
  }

  if (!data.username) {
    return Promise.reject(new Error("User doesn't exist"));
  }

  return Promise.resolve(data.username);
}

/**
 * Get user from given auth data
 *
 * @param {{ type: string, token: string, data: unknown }} param0 - The auth authData
 *
 * @returns {Promise<User | null | undefined>}
 */
async function getUserFromAuthData({ type, token, data }) {
  if (!token || !data) {
    return undefined;
  }

  let username = '';
  switch (type) {
    case 'oauth':
      username = await getUsernameFromOAuth(token, data);
      break;
    case 'old_jwt':
      username = await getUsernameFromOldJWT(token, data);
      break;
    case 'api_key':
      username = await getUsernameFromApiKey(token, data);
      break;

    default:
      throw new Error('auth type unsupported');
  }

  const service = new UsersService();
  return service.findUnique({ where: { username } });
}

/**
 * Get institution id from api key
 *
 * @param {string} token - The token found in request
 * @param {ApiKey} data - The data of the token
 *
 * @returns {Promise<string>} - The username found in data. Returns a promise to be uniform.
 */
function getInstitutionIdFromApiKey(token, data) {
  if (!data.institutionId) {
    return Promise.reject(Error('API key is scoped to an institution'));
  }
  return Promise.resolve(data.institutionId);
}

/**
 * Get institution from given auth data
 *
 * @param {{ type: string, token: string, data: unknown }} param0 - The auth authData
 *
 * @returns {Promise<Institution | null | undefined>}
 */
async function getInstitutionFromAuthData({ type, token, data }) {
  if (!token || !data) {
    return undefined;
  }

  let id;
  switch (type) {
    case 'api_key':
      id = await getInstitutionIdFromApiKey(token, data);
      break;

    default:
      throw new Error('auth type unsupported');
  }

  const service = new InstitutionsService();
  return service.findUnique({ where: { id } });
}

/**
 * Check if request have a valid user
 *
 * Needs `requireAuth`
 *
 * @param {KoaContext} ctx - Koa context
 * @param {KoaNext} next - Next handler
 */
const requireUser = async (ctx, next) => {
  let user;
  try {
    user = await getUserFromAuthData(ctx.state?.authData ?? {});
  } catch (err) {
    appLogger.warn(`[auth] Couldn't get user from auth data: ${err}`);
    user = null;
  }

  if (user) {
    ctx.state.user = user;
    ctx.state.userIsAdmin = user.isAdmin;
    triggerHooks('user:action', user);
    if (ctx.state.authData.type === 'api_key') {
      triggerHooks('api-key:action', ctx.state.authData.data);
    }

    await next();
    return;
  }

  if (user === undefined) {
    ctx.throw(401, ctx.$t('errors.auth.noUsername'));
    return;
  }

  ctx.throw(401, ctx.$t('errors.auth.unableToFetchUser'));
};

/**
 * Check if request have a valid user, or a valid API Key
 *
 * Needs `requireAuth`
 *
 * @param {KoaContext} ctx - Koa context
 * @param {KoaNext} next - Next handler
 */
const requireUserOrInstitution = async (ctx, next) => {
  let user;
  try {
    user = await getUserFromAuthData(ctx.state?.authData ?? {});
  } catch (err) {
    appLogger.warn(`[auth] Couldn't get user from auth data: ${err}`);
    user = null;
  }

  if (user) {
    ctx.state.user = user;
    ctx.state.userIsAdmin = user.isAdmin;
    triggerHooks('user:action', user);
    if (ctx.state.authData.type === 'api_key') {
      triggerHooks('api-key:action', ctx.state.authData.data);
    }

    await next();
    return;
  }

  let institution;
  try {
    institution = await getInstitutionFromAuthData(ctx.state?.authData ?? {});
  } catch (err) {
    appLogger.warn(`[auth] Couldn't get institution from auth data: ${err}`);
    institution = null;
  }

  if (institution) {
    triggerHooks('api-key:action', ctx.state.authData.data);

    await next();
    return;
  }

  if (user === undefined) {
    ctx.throw(401, ctx.$t('errors.auth.noUsername'));
    return;
  }

  ctx.throw(401, ctx.$t('errors.auth.unableToFetchUser'));
};

/**
 * Check if request have a user that have accepted terms
 *
 * Needs `requireUser` or `requireUserOrInstitution`
 *
 * @param {KoaContext} ctx - Koa context
 * @param {KoaNext} next - Next handler
 */
const requireTermsOfUse = async (ctx, next) => {
  if (!ctx.state?.authData) {
    ctx.throw(403, ctx.$t('errors.termsOfUse'));
    return;
  }
  if (ctx.state?.user && !ctx.state.user.metadata?.acceptedTerms) {
    ctx.throw(403, ctx.$t('errors.termsOfUse'));
    return;
  }

  await next();
};

/**
 * Check if request have a user that have the provided role(s)
 *
 * Needs `requireUser`
 *
 * @param {string | string[]} role
 *
 * @returns {(ctx: KoaContext, next: KoaNext) => Promise<void>} The handler
 */
const requireAnyRole = (role) => async (ctx, next) => {
  const { user } = ctx.state;

  const roles = Array.isArray(role) ? role : [role];

  if (!Array.isArray(user && user.roles) || !user.roles.some((r) => roles.includes(r))) {
    ctx.throw(403, ctx.$t('errors.perms.feature'));
  }

  await next();
};

/**
 * Check if request have a user that is admin
 *
 * Needs `requireUser`
 *
 * @param {KoaContext} ctx - Koa context
 * @param {KoaNext} next - Next handler
 */
const requireAdmin = (ctx, next) => {
  if (!ctx.state?.user?.isAdmin) {
    ctx.throw(403, ctx.$t('errors.perms.feature'));
  }

  return next();
};

/**
 * Forbids API keys from accessing that ressource
 *
 *  Needs `requireAuth`
 *
 * @param {KoaContext} ctx - Koa context
 * @param {KoaNext} next - Next handler
 */
const forbidAPIKeys = (ctx, next) => {
  if (!ctx.state?.authData || ctx.state.authData?.type === 'api_key') {
    ctx.throw(403, ctx.$t('errors.perms.feature'));
  }

  return next();
};

/**
 * Middleware that fetches an item from a model and put it in ctx.state
 * Looks for {modelName}Id in the route params by default
 *
 * Needs `requireUser`
 */
function fetchModel(modelName, opts = {}) {
  const {
    query: queryField,
    params: paramField = `${modelName}Id`,
    state: stateField = modelName,
    getId,
    ignoreNotFound,
  } = opts;

  return async (ctx, next) => {
    const username = ctx.state?.user?.username;
    let modelId;

    if (typeof getId === 'function') {
      modelId = getId(ctx);
    }
    if (paramField && !modelId) {
      modelId = ctx.params[paramField];
    }
    if (queryField && !modelId) {
      modelId = ctx.query[queryField];
    }

    let item;

    const findOptions = {
      where: { id: modelId },
      include: opts?.include,
      select: opts?.select,
    };

    switch (modelName) {
      case 'institution': {
        findOptions.include = findOptions.include ?? {
          memberships: { where: { username } },
        };

        const institutionsService = new InstitutionsService();
        item = modelId && (await institutionsService.findUnique(findOptions));

        break;
      }

      case 'sushi-endpoint': {
        const sushiEndpointService = new SushiEndpointService();
        item = modelId && await sushiEndpointService.findUnique(findOptions);
        break;
      }

      case 'sushi': {
        const sushiCredentialsService = new SushiCredentialsService();
        item = modelId && await sushiCredentialsService.findUnique(findOptions);
        break;
      }

      case 'repository': {
        const repositoriesService = new RepositoriesService();
        findOptions.where = { pattern: modelId };
        item = modelId && await repositoriesService.findUnique(findOptions);
        break;
      }

      case 'repositoryAlias': {
        const repositoryAliasesService = new RepositoryAliasesService();
        findOptions.where = { pattern: modelId };
        item = modelId && await repositoryAliasesService.findUnique(findOptions);
        break;
      }

      case 'space': {
        const spacesService = new SpacesService();
        item = modelId && await spacesService.findUnique(findOptions);
        break;
      }

      default:
    }

    if (!item && !ignoreNotFound) {
      ctx.throw(404, ctx.$t(`errors.${modelName}.notFound`));
      return;
    }

    ctx.state[stateField] = item;
    await next();
  };
}

/**
 * Middleware that checks that user is either admin or institution contact
 * Assumes that ctx.state contains institution and user
 */
function requireContact() {
  return (ctx, next) => {
    const { user, institution } = ctx.state;

    if (user?.isAdmin) { return next(); }

    const membership = institution?.memberships?.find?.((m) => m?.username === user?.username);
    const isContact = membership?.roles?.some?.((r) => r === DOC_CONTACT || r === TECH_CONTACT);
    if (isContact) { return next(); }

    ctx.throw(403, ctx.$t('errors.institution.unauthorized'));
    return undefined;
  };
}

/**
 * Middleware that checks that user has a sufficient permission level on a feature
 * Assumes that ctx.state contains institution and user
 */
function requireMemberPermissions(...permissions) {
  return (ctx, next) => {
    const { user, institution } = ctx.state;

    if (user?.isAdmin) { return next(); }

    const membership = institution?.memberships?.find?.((m) => m?.username === user?.username);

    const memberPermissions = new Set(
      Array.isArray(membership?.permissions) ? membership?.permissions : [],
    );
    const hasPermissions = memberPermissions.has('all') || permissions.every((perm) => memberPermissions.has(perm));

    if (hasPermissions) { return next(); }

    ctx.throw(403, ctx.$t('errors.perms.feature'));
    return undefined;
  };
}

/**
 * Middleware that checks that the institution is valid
 * Assumes that ctx.state contains institution
 */
function requireValidatedInstitution(opts = {}) {
  const { ignoreIfAdmin } = opts;

  return (ctx, next) => {
    const { institution, userIsAdmin } = ctx.state;

    if (userIsAdmin && ignoreIfAdmin) { return next(); }
    if (institution?.validated === true) { return next(); }

    ctx.throw(400, ctx.$t('errors.sushi.institutionNotValidated'));
    return undefined;
  };
}

module.exports = {
  requireAuth,
  /** @deprecated use `requireAuth` (currently an alias) */
  requireJwt: requireAuth,
  requireUser,
  requireUserOrInstitution,
  requireAdmin,
  requireTermsOfUse,
  requireAnyRole,
  requireContact,
  requireMemberPermissions,
  requireValidatedInstitution,
  forbidAPIKeys,
  fetchModel,
  fetchInstitution: (opts = {}) => fetchModel('institution', { state: 'institution', ...opts }),
  fetchSushi: (opts = {}) => fetchModel('sushi', { state: 'sushi', ...opts }),
  fetchSushiEndpoint: (opts = {}) => fetchModel('sushi-endpoint', { state: 'endpoint', params: 'endpointId', ...opts }),
  fetchRepository: (opts = {}) => fetchModel('repository', { state: 'repository', params: 'pattern', ...opts }),
  fetchRepositoryAlias: (opts = {}) => fetchModel('repositoryAlias', { state: 'alias', params: 'pattern', ...opts }),
  fetchSpace: (opts = {}) => fetchModel('space', { state: 'space', params: 'spaceId', ...opts }),
};
