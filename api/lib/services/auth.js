const { auth } = require('config');
const jwt = require('jsonwebtoken');

const openid = require('../utils/openid');

const InstitutionsService = require('../entities/institutions.service');
const SushiEndpointService = require('../entities/sushi-endpoints.service');
const SushiCredentialsService = require('../entities/sushi-credentials.service');
const UsersService = require('../entities/users.service');
const RepositoriesService = require('../entities/repositories.service');
const RepositoryAliasesService = require('../entities/repository-aliases.service');
const SpacesService = require('../entities/spaces.service');

const { MEMBER_ROLES } = require('../entities/memberships.dto');

const { DOC_CONTACT, TECH_CONTACT } = MEMBER_ROLES;

/**
 * Get JWT data of cookie using OpenID provider
 *
 * @param {string} cookie - The cookie found in request
 *
 * @returns {Promise<{ type: 'oauth', token: string, data: unknown }>}
 */
async function getJWTDataFromCookie(cookie) {
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
 * Get JWT data of header using JWT methods
 *
 * @param {string} header - The header found in request
 *
 * @returns {Promise<{ type: 'api_key', token: string, data: unknown }>}
 */
function getJWTDataFromHeader(header) {
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
        type: 'api_key',
        token,
        data,
      });
    });
  });
}

/**
 * Check if request have a valid JWT, and decode it's cotent
 *
 * @param {import('koa').Context} ctx - Koa context
 * @param {import('koa').Next} next - Next handler
 */
const requireJwt = async (ctx, next) => {
  let jwtData = {};

  try {
    const cookie = ctx.cookies.get(auth.cookie);
    if (cookie) {
      jwtData = await getJWTDataFromCookie(cookie);
    }

    const header = ctx.get('authorization');
    if (header) {
      jwtData = await getJWTDataFromHeader(header);
    }
  } catch {
    ctx.throw(401, ctx.$t('errors.auth.unableToFetchUser'));
    return;
  }

  if (!jwtData.token || !jwtData.data) {
    ctx.throw(401, ctx.$t('errors.auth.unableToFetchUser'));
    return;
  }

  ctx.state.jwtData = jwtData;
  await next();
};

/**
 * Get username from OAuth (using OpenID provider)
 *
 * @param {string} token - The token found in request
 * @param {unknown} data - The data of the token
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
 * Get username from API_KEY
 *
 * @param {string} token - The token found in request
 * @param {unknown} data - The data of the token
 *
 * @returns {Promise<string>} - The username found in data. Returns a promise to prepare
 * for next upgrades (api keys in DB, etc.)
 */
function getUsernameFromApiKey(token, data) {
  return Promise.resolve(data.username);
}

/**
 * Check if request have a valid user
 *
 * Needs `requireJWT`
 *
 * @param {import('koa').Context} ctx - Koa context
 * @param {import('koa').Next} next - Next handler
 */
const requireUser = async (ctx, next) => {
  const { jwtData } = ctx.state ?? {};

  if (!jwtData?.token || !jwtData?.data) {
    ctx.throw(401, ctx.$t('errors.auth.noUsername'));
    return;
  }

  let username;

  try {
    switch (jwtData.type) {
      case 'oauth':
        username = await getUsernameFromOAuth(jwtData.token, jwtData.data);
        break;
      case 'api_key':
        username = await getUsernameFromApiKey(jwtData.token, jwtData.data);
        break;

      default:
        throw new Error('JWT type unsupported');
    }
  } catch {
    ctx.throw(401, ctx.$t('errors.auth.unableToFetchUser'));
    return;
  }

  if (!username) {
    ctx.throw(401, ctx.$t('errors.auth.noUsername'));
    return;
  }

  const usersService = new UsersService();
  const user = await usersService.findUnique({ where: { username } });

  if (!user) {
    ctx.throw(401, ctx.$t('errors.auth.unableToFetchUser'));
    return;
  }

  ctx.state.user = user;
  ctx.state.userIsAdmin = user.isAdmin;

  await next();
};

const requireTermsOfUse = async (ctx, next) => {
  if (!ctx.state?.user?.metadata?.acceptedTerms) {
    ctx.throw(403, ctx.$t('errors.termsOfUse'));
    return;
  }

  await next();
};

const requireAnyRole = (role) => async (ctx, next) => {
  const { user } = ctx.state;

  const roles = Array.isArray(role) ? role : [role];

  if (!Array.isArray(user && user.roles) || !user.roles.some((r) => roles.includes(r))) {
    ctx.throw(403, ctx.$t('errors.perms.feature'));
  }

  await next();
};

const requireAdmin = (ctx, next) => {
  if (!ctx.state?.user?.isAdmin) {
    ctx.throw(403, ctx.$t('errors.perms.feature'));
  }

  return next();
};

/**
 * Middleware that fetches an item from a model and put it in ctx.state
 * Looks for {modelName}Id in the route params by default
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
  requireJwt,
  requireUser,
  requireAdmin,
  requireTermsOfUse,
  requireAnyRole,
  requireContact,
  requireMemberPermissions,
  requireValidatedInstitution,
  fetchModel,
  fetchInstitution: (opts = {}) => fetchModel('institution', { state: 'institution', ...opts }),
  fetchSushi: (opts = {}) => fetchModel('sushi', { state: 'sushi', ...opts }),
  fetchSushiEndpoint: (opts = {}) => fetchModel('sushi-endpoint', { state: 'endpoint', params: 'endpointId', ...opts }),
  fetchRepository: (opts = {}) => fetchModel('repository', { state: 'repository', params: 'pattern', ...opts }),
  fetchRepositoryAlias: (opts = {}) => fetchModel('repositoryAlias', { state: 'alias', params: 'pattern', ...opts }),
  fetchSpace: (opts = {}) => fetchModel('space', { state: 'space', params: 'spaceId', ...opts }),
};
