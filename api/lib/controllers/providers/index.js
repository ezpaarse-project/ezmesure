const Koa = require('koa');
const route = require('koa-route');
const bodyParser = require('koa-bodyparser');

const { list, find, register, load, del, check } = require('./actions');

const app = new Koa();

app.use(bodyParser());
app.use(route.get('/check', check));
app.use(route.get('/', list));
app.use(route.get('/:providerName', find));
app.use(route.delete('/:providerName', del));
app.use(route.put('/:providerName', register));
app.use(route.post('/:providerName', load));

module.exports = app;
