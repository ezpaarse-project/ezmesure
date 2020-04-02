
const Koa = require('koa');
const router = require('koa-joi-router');

const { renaterLogin, logout } = require('./auth/auth');
const logs = require('./logs');
const files = require('./files');
const authorize = require('./auth');
const providers = require('./providers');
const partners = require('./partners');
const metrics = require('./metrics');
const correspondent = require('./correspondent');

const openapi = require('./openapi.json');

const app = new Koa();

const publicRouter = router();
publicRouter.get('/login', renaterLogin);
publicRouter.get('/logout', logout);

publicRouter.get('/', async (ctx) => {
  ctx.status = 200;
  ctx.body = 'OK';
});

publicRouter.get('/openapi.json', async (ctx) => {
  ctx.status = 200;
  ctx.type = 'json';
  ctx.body = openapi;
});

app.use(publicRouter.middleware());
app.use(partners.prefix('/partners').middleware());
app.use(metrics.prefix('/metrics').middleware());

app.use(authorize.prefix('/profile').middleware());
app.use(logs.prefix('/logs').middleware());
app.use(files.prefix('/files').middleware());
app.use(providers.prefix('/providers').middleware());
app.use(correspondent.prefix('/correspondent').middleware());

module.exports = app;
