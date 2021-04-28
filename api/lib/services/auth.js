const { auth } = require('config');
const jwt = require('koa-jwt');
const elastic = require('../services/elastic');

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

module.exports = {
  requireJwt,
  requireUser,
  requireTermsOfUse,
  requireAnyRole,
};
