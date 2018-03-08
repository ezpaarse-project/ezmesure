'use strict';

const Koa = require('koa');
const jwt = require('koa-jwt');
const route = require('koa-route');
const mount = require('koa-mount');
const { auth } = require('config');

const { renaterLogin } = require('./auth/auth');
const logs = require('./logs');
const files = require('./files');
const authorize = require('./auth');
const providers = require('./providers');
const partners = require('./partners');

const app = new Koa();

app.use(route.get('/login', renaterLogin));

app.use(route.get('/', async ctx => {
  ctx.status = 200;
  ctx.body   = 'OK';
}));

app.use(mount('/partners', partners));

app.use(jwt({ secret: auth.secret, cookie: auth.cookie }));
app.use(async (ctx, next) => {
  if (!ctx.state.user || !ctx.state.user.username) {
    return ctx.throw(401, 'no username in the token');
  }
  await next();
});

app.use(mount('/profile', authorize));
app.use(mount('/logs', logs));
app.use(mount('/files', files));
app.use(mount('/providers', providers));

module.exports = app;
