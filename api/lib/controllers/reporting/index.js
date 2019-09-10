const Koa   = require('koa');
const route = require('koa-route');
const bodyParser = require('koa-bodyparser');

const { list, store, update, del } = require('./reporting');

const app = new Koa();

app.use(route.get('/list/:space?', list));
app.use(route.delete('/delete/:index', del));

app.use(bodyParser());
app.use(route.post('/store', store));
app.use(route.put('/update/:index', update));

module.exports = app;
