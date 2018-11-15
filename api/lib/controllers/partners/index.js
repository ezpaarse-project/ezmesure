const Koa = require('koa');
const route = require('koa-route');
const jwt = require('koa-jwt');

const { auth } = require('config');
const { list, refresh } = require('./actions');

const app = new Koa();

app.use(route.get('/', list));

app.use(jwt({ secret: auth.secret, cookie: auth.cookie }));

app.use(route.post('/refresh', refresh));

module.exports = app;
