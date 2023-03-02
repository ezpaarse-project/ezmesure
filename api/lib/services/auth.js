const { auth } = require('config');
const jwt = require('koa-jwt');
const elastic = require('./elastic');
const { getModel } = require('../models/TypedModel');
const institutionsService = require('../entities/institutions.service');
const usersService = require('../entities/users.service');

const requireJwt = jwt({
  secret: auth.secret,
  cookie: auth.cookie,
});

const requireUser = async (ctx, next) => {
  const username = ctx.state?.user?.username;

  if (!username) {
    ctx.throw(401, ctx.$t('errors.auth.noUsername'));
    return;
  }

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
  const user = await elastic.security.findUser({ username: ctx.state.user.username });

  if (!user.metadata.acceptedTerms) {
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
    if (modelName === 'institution') {
      item = modelId && await institutionsService.findUnique({
        where: { id: modelId },
        include: {
          memberships: {
            where: {
              OR: [
                { isDocContact: true },
                { isTechContact: true },
              ],
            },
          },
        },
      });
    } else {
      item = modelId && await getModel(modelName).findById(modelId);
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

    const isContact = institution?.memberships?.some?.((m) => (
      (m?.username === user?.username) && (m.isDocContact || m.isTechContact)
    ));
    if (isContact) { return next(); }

    ctx.throw(403, ctx.$t('errors.institution.unauthorized'));
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
    if (institution?.get?.('validated') === true) { return next(); }

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
  requireValidatedInstitution,
  fetchModel,
  fetchInstitution: (opts = {}) => fetchModel('institution', { state: 'institution', ...opts }),
  fetchSushi: (opts = {}) => fetchModel('sushi', { state: 'sushi', ...opts }),
  fetchSushiEndpoint: (opts = {}) => fetchModel('sushi-endpoint', { state: 'endpoint', params: 'endpointId', ...opts }),
};
