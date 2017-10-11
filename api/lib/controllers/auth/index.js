const koa = require('koa');
const route = require('koa-route');

const { updatePassword, resetPassword, getToken, getUser } = require('./auth');

const app = koa();

app.use(route.get('/', getUser));
app.use(route.get('/token', getToken));
app.use(route.put('/password/reset', resetPassword));

module.exports = app;
