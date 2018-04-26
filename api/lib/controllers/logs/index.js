const Koa   = require('koa');
const route = require('koa-route');

const { list, del, tops } = require('./basics');
const upload = require('./upload');

const app = new Koa();

app.use(route.get('/', list));
app.use(route.get('/:index/tops', tops));
app.use(route.delete('/:index', del));
app.use(route.post('/:index', upload));

module.exports = app;
