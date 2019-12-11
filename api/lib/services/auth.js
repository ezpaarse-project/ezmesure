const { auth } = require('config');
const jwt = require('koa-jwt');
const elastic = require('../services/elastic');

const requireJwt = jwt({
  secret: auth.secret,
  cookie: auth.cookie,
});

const requireUser = async (ctx, next) => {
  if (!ctx.state.user || !ctx.state.user.username) {
    return ctx.throw(401, 'no username in the token');
  }

  const user = await elastic.security.findUser({ username: ctx.state.user.username });

  if (!user) {
    return ctx.throw(401, 'Unable to fetch user data, please log in again');
  }

  await next();
};

const requireTermsOfUse = async (ctx, next) => {
  const user = await elastic.security.findUser({ username: ctx.state.user.username });

  if (!user.metadata.acceptedTerms) {
    return ctx.throw(403, 'You must accept the terms of use before using this service');
  }

  await next();
};

module.exports = {
  requireJwt,
  requireUser,
  requireTermsOfUse,
};
