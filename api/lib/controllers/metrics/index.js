const Koa = require('koa');
const route = require('koa-route');

const { overall } = require('./metrics');

const app = new Koa();

app.use(route.get('/', overall));

module.exports = app;
