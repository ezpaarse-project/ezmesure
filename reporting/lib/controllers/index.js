const Koa = require('koa');
const route = require('koa-route');
const mount = require('koa-mount');
const { name, version } = require('../../package.json');

const reporting = require('./reporting');

const app = new Koa();

app.use(route.get('/', async (ctx) => {
  ctx.action = 'reporting/index';
  ctx.status = 200;
  ctx.body = { name, version };
}));

app.use(mount('/reporting', reporting));

module.exports = app;
