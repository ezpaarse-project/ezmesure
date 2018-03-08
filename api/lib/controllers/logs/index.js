const Koa   = require('koa');
const route = require('koa-route');

const { list, del } = require('./basics');
const upload = require('./upload');

const app = new Koa();

app.use(route.get('/', list));
app.use(route.delete('/:orgName', del));
app.use(route.post('/:orgName', upload));

module.exports = app;
