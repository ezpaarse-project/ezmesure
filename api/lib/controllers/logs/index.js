const Koa   = require('koa');
const route = require('koa-route');

const { list, deleteIndice, deleteEvents, tops } = require('./basics');
const upload = require('./upload');

const app = new Koa();

app.use(route.get('/', list));
app.use(route.get('/:index/tops', tops));
app.use(route.delete('/:index', deleteIndice));
app.use(route.delete('/:index/events', deleteEvents));
app.use(route.post('/:index', upload));

module.exports = app;
