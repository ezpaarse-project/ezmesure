const { auth } = require('config');
const jwt = require('koa-jwt');
const InstitutionsService = require('../entities/institutions.service');
const SushiEndpointService = require('../entities/sushi-endpoints.service');
const SushiCredentialsService = require('../entities/sushi-credentials.service');
const UsersService = require('../entities/users.service');
const RepositoriesService = require('../entities/repositories.service');
const RepositoryAliasesService = require('../entities/repository-aliases.service');
const SpacesService = require('../entities/spaces.service');

const { MEMBER_ROLES } = require('../entities/memberships.dto');

const { DOC_CONTACT, TECH_CONTACT } = MEMBER_ROLES;

const requireJwt = jwt({
  secret: auth.secret,
  cookie: auth.cookie,
  key: 'jwtdata',
});

const requireUser = async (ctx, next) => {
  const username = ctx.state?.jwtdata?.username;

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
        const institutionsService = new InstitutionsService();
        item = modelId && (await institutionsService.findUnique({
          where: { id: modelId },
          include: {
            memberships: {
              where: { username },
            },
          },
        }));
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
