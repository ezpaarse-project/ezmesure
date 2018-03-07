const Koa = require('koa');
const route = require('koa-route');

const { updatePassword, resetPassword, getToken, getUser } = require('./auth');

const app = new Koa();

app.use(route.get('/', getUser));
app.use(route.get('/token', getToken));
app.use(route.put('/password/reset', resetPassword));

module.exports = app;
