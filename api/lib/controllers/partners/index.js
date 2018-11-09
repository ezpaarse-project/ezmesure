const Koa = require('koa');
const route = require('koa-route');

const { list, refresh } = require('./actions');

const app = new Koa();

app.use(route.get('/', list));
app.use(route.post('/refresh', refresh));

module.exports = app;
