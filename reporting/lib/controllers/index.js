const Koa = require('koa');
const router = require('koa-joi-router')();
const { name, version } = require('../../package.json');

const tasks = require('./tasks');
const dashboards = require('./dashboards');
const frequencies = require('./frequencies');
const spaces = require('./spaces');

const app = new Koa();

router.get('/', async (ctx) => {
  ctx.action = 'reporting/index';
  ctx.status = 200;
  ctx.body = { name, version };
});

app.use(router.middleware());

app.use(tasks.prefix('/tasks').middleware());
app.use(dashboards.prefix('/dashboards').middleware());
app.use(frequencies.prefix('/frequencies').middleware());
app.use(spaces.prefix('/spaces').middleware());

module.exports = app;
