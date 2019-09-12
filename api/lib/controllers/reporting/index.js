const Koa   = require('koa');
const route = require('koa-route');
const bodyParser = require('koa-bodyparser');

const { list, store, update, del } = require('./reporting');

const app = new Koa();

app.use(route.get('/tasks/:space?', list));
app.use(route.delete('/tasks/:id', del));

app.use(bodyParser());
app.use(route.post('/tasks', store));
app.use(route.patch('/tasks/:id', update));

module.exports = app;
