const { auth } = require('config');
const jwt = require('koa-jwt');
const elastic = require('./elastic');
const Institution = require('../models/Institution');
const Sushi = require('../models/Sushi');

const requireJwt = jwt({
  secret: auth.secret,
  cookie: auth.cookie,
});

const requireUser = async (ctx, next) => {
  if (!ctx.state.user || !ctx.state.user.username) {
    ctx.throw(401, ctx.$t('errors.auth.noUsername'));
    return;
  }

  const user = await elastic.security.findUser({ username: ctx.state.user.username });

  if (!user) {
    ctx.throw(401, ctx.$t('errors.auth.unableToFetchUser'));
    return;
  }

  const roles = new Set(user.roles || []);

  ctx.state.user = user;
  ctx.state.userIsAdmin = (roles.has('admin') || roles.has('superuser'));

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

/**
 * Middleware that fetches an institution and put it in ctx.state.institution
 * Looks for institutionId in the route params by default
 */
function fetchInstitution(opts = {}) {
  const { query: queryField } = opts;
  let { params: paramField } = opts;

  if (!paramField && !queryField) {
    paramField = 'institutionId';
  }

  return async (ctx, next) => {
    let institutionId;

    if (typeof opts === 'function') {
      institutionId = opts(ctx);
    }
    if (paramField && !institutionId) {
      institutionId = ctx.params[paramField];
    }
    if (queryField && !institutionId) {
      institutionId = ctx.query[queryField];
    }

    const institution = await Institution.findById(institutionId);

    if (!institution) {
      ctx.throw(404, ctx.$t('errors.institution.notFound'));
      return;
    }

    ctx.state.institution = institution;
    await next();
  };
}

/**
 * Middleware that fetches a SUSHI item and put it in ctx.state.sushi
 * Looks for sushiId in the route params by default
 */
function fetchSushi(opts = {}) {
  const { query: queryField } = opts;
  let { params: paramField } = opts;

  if (!paramField && !queryField) {
    paramField = 'sushiId';
  }

  return async (ctx, next) => {
    let sushiId;

    if (typeof opts === 'function') {
      sushiId = opts(ctx);
    }
    if (paramField && !sushiId) {
      sushiId = ctx.params[paramField];
    }
    if (queryField && !sushiId) {
      sushiId = ctx.query[queryField];
    }

    const sushi = await Sushi.findById(sushiId);

    if (!sushi) {
      ctx.throw(404, ctx.$t('errors.sushi.notFound'));
      return;
    }

    ctx.state.sushi = sushi;
    await next();
  };
}

/**
 * Middleware that checks that user is either admin or institution contact
 * Assumes that ctx.state contains institution and user
 */
function requireContact(opts = {}) {
  const { allowCreator } = opts;

  return (ctx, next) => {
    const { user, institution, userIsAdmin } = ctx.state;

    if (userIsAdmin) { return next(); }
    if (user && institution && institution.isContact(user)) { return next(); }
    if (allowCreator && user && institution && institution.isCreator(user)) { return next(); }

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
  requireTermsOfUse,
  requireAnyRole,
  fetchInstitution,
  fetchSushi,
  requireContact,
  requireValidatedInstitution,
};
