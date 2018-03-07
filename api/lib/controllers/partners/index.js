const Koa = require('koa');
const route = require('koa-route');

const { list } = require('./actions');

const app = new Koa();

app.use(route.get('/', list));

module.exports = app;
