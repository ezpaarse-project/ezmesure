const koa   = require('koa');
const route = require('koa-route');

const { list, del } = require('./basics');
const upload = require('./upload');

const app = koa();

app.use(route.get('/', list));
app.use(route.delete('/:orgName', del));
app.use(route.post('/:orgName', upload));

module.exports = app;
