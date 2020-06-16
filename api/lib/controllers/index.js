
const Koa = require('koa');
const router = require('koa-joi-router');
const { Joi } = require('koa-joi-router');

const { renaterLogin, elasticLogin, logout } = require('./auth/auth');
const logs = require('./logs');
const files = require('./files');
const authorize = require('./auth');
const providers = require('./providers');
const partners = require('./partners');
const metrics = require('./metrics');
const institutions = require('./institutions');
const sushi = require('./sushi');

const openapi = require('./openapi.json');

const app = new Koa();

const publicRouter = router();
publicRouter.get('/login', renaterLogin);
publicRouter.get('/logout', logout);

publicRouter.route({
  method: 'POST',
  path: '/login/local',
  handler: elasticLogin,
  validate: {
    type: 'json',
    body: {
      username: Joi.string().required().trim().min(1),
      password: Joi.string().required().trim().min(1),
    },
  },
});

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
app.use(institutions.prefix('/institutions').middleware());
app.use(sushi.prefix('/sushi').middleware());

module.exports = app;
