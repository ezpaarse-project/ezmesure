const Koa = require('koa');
const route = require('koa-route');
const bodyParser = require('koa-bodyparser');

const {
  list, deleteOne, deleteMany, upload,
} = require('./actions');

const app = new Koa();

app.use(route.get('/', list));
app.use(route.put('/:fileName', upload));
app.use(route.delete('/:fileName', deleteOne));

app.use(bodyParser());
app.use(route.post('/delete_batch', deleteMany));

module.exports = app;
