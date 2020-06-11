const { auth } = require('config');
const jwt = require('koa-jwt');
const elastic = require('../services/elastic');

const requireJwt = jwt({
  secret: auth.secret,
  cookie: auth.cookie,
});

const requireUser = async (ctx, next) => {
  if (!ctx.state.user || !ctx.state.user.username) {
    ctx.throw(401, 'no username in the token');
    return;
  }

  const user = await elastic.security.findUser({ username: ctx.state.user.username });

  if (!user) {
    ctx.throw(401, 'Unable to fetch user data, please log in again');
    return;
  }

  ctx.state.user = user;

  await next();
};

const requireTermsOfUse = async (ctx, next) => {
  const user = await elastic.security.findUser({ username: ctx.state.user.username });

  if (!user.metadata.acceptedTerms) {
    ctx.throw(403, 'You must accept the terms of use before using this service');
    return;
  }

  await next();
};

module.exports = {
  requireJwt,
  requireUser,
  requireTermsOfUse,
};
