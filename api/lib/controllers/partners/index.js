const koa = require('koa');
const route = require('koa-route');

const { list } = require('./actions');

const app = koa();

app.use(route.get('/', list));

module.exports = app;
