'use strict';

const koa = require('koa');
const jwt = require('koa-jwt');
const route = require('koa-route');
const mount = require('koa-mount');
const { auth } = require('config');

const { renaterLogin } = require('./auth/auth');
const logs = require('./logs');
const authorize = require('./auth');
const providers = require('./providers');

const app = koa();

app.use(route.get('/login', renaterLogin));

app.use(route.get('/', function* main() {
  this.status = 200;
  this.body   = 'OK';
}));

app.use(jwt({ secret: auth.secret, cookie: auth.cookie }));
app.use(function* (next) {
  if (!this.state.user || !this.state.user.username) {
    return this.throw('no username in the token', 401);
  }
  yield next;
});

app.use(mount('/profile', authorize));
app.use(mount('/logs', logs));
app.use(mount('/providers', providers));

module.exports = app;
