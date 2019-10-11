
const Koa = require('koa');
const koaJwt = require('koa-jwt');
const route = require('koa-route');
const mount = require('koa-mount');
const { auth } = require('config');

const { renaterLogin } = require('./auth/auth');
const logs = require('./logs');
const files = require('./files');
const authorize = require('./auth');
const providers = require('./providers');
const partners = require('./partners');
const metrics = require('./metrics');

const elastic = require('../services/elastic');
const openapi = require('./openapi.json');

const app = new Koa();

app.use(route.get('/login', renaterLogin));

app.use(route.get('/', async (ctx) => {
  ctx.status = 200;
  ctx.body = 'OK';
}));

app.use(route.get('/openapi.json', async (ctx) => {
  ctx.status = 200;
  ctx.type = 'json';
  ctx.body = openapi;
}));

app.use(mount('/partners', partners));
app.use(mount('/metrics', metrics));

const jwtMiddleware = koaJwt({ secret: auth.secret, cookie: auth.cookie });
const authMiddleware = async (ctx, next) => {
  if (!ctx.state.user || !ctx.state.user.username) {
    return ctx.throw(401, 'no username in the token');
  }
  await next();
};

/**
 * Any route below requires an authenticated user
 */
app.use(async (ctx, next) => {
  const user = await elastic.security.findUser({ username: ctx.state.user.username });

  if (!user) {
    return ctx.throw(401, 'Unable to fetch user data, please log in again');
  }

  await next();
});

const termsOfUseMiddleware = async (ctx, next) => {
  const user = await elastic.security.findUser({ username: ctx.state.user.username });

  if (!user.metadata.acceptedTerms) {
    return ctx.throw(403, 'You must accept the terms of use before using this service');
  }

  await next();
};

app.use(mount('/profile', jwtMiddleware, authMiddleware, authorize));

app.use(mount('/logs', jwtMiddleware, authMiddleware, termsOfUseMiddleware, logs));
app.use(mount('/files', jwtMiddleware, authMiddleware, termsOfUseMiddleware, files));
app.use(mount('/providers', jwtMiddleware, authMiddleware, termsOfUseMiddleware, providers));

module.exports = app;
