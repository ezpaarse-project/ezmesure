const Koa = require('koa');
const route = require('koa-route');
const bodyParser = require('koa-bodyparser');

const {
  list, deleteIndice, deleteEvents, tops,
} = require('./basics');
const search = require('./search');
const upload = require('./upload');

const app = new Koa();

app.use(route.get('/', list));
app.use(route.get('/:index/tops', tops));
app.use(route.delete('/:index', deleteIndice));
app.use(route.delete('/:index/events', deleteEvents));
app.use(route.post('/:index', upload));

app.use(bodyParser());
app.use(route.post('/:index/search', search));

module.exports = app;
