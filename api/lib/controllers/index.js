const Koa = require('koa');
const router = require('koa-joi-router');
const serve = require('koa-static');
const mount = require('koa-mount');
const path = require('path');

const config = require('./config');
const logs = require('./logs');
const auth = require('./auth');
const partners = require('./partners');
const metrics = require('./metrics');
const roles = require('./roles');
const institutions = require('./institutions');
const customFields = require('./custom-fields');
const harvests = require('./harvests');
const harvestsSessions = require('./harvests-sessions');
const sushi = require('./sushi');
const sushiEndpoints = require('./sushi-endpoints');
const sushiAlerts = require('./sushi-alerts');
const tasks = require('./tasks');
const taskLogs = require('./task-logs');
const contact = require('./contact');
const opendata = require('./opendata');
const memberships = require('./memberships');
const users = require('./users');
const testUsers = require('./test-users');
const dashboards = require('./dashboards');
const spaces = require('./spaces');
const indices = require('./indices');
const repositories = require('./repositories');
const repositoryAliases = require('./repository-aliases');
const repositoryAliasTemplates = require('./repository-alias-templates');
const kibanaSpaces = require('./kibana-spaces');
const esRoles = require('./elastic-roles');
const queues = require('./queues');
const kibana = require('./kibana');
const activity = require('./activity');
const actions = require('./actions');
const sync = require('./sync');
const apiKeys = require('./api-keys');
const kibanaBridge = require('./kibana-bridge');

const openapi = require('./openapi.json');

const app = new Koa();

const publicRouter = router();

publicRouter.get('/', async (ctx) => {
  ctx.status = 200;
  ctx.body = 'OK';
});

publicRouter.get('/openapi.json', async (ctx) => {
  ctx.status = 200;
  ctx.type = 'json';
  ctx.body = openapi;
});

const assetsDir = path.resolve(__dirname, '..', '..', 'uploads');
// koa-serve doesn't work with the router
app.use(mount('/assets', serve(assetsDir)));

app.use(publicRouter.middleware());
app.use(config.prefix('/config').middleware());
app.use(partners.prefix('/partners').middleware());
app.use(metrics.prefix('/metrics').middleware());
app.use(contact.prefix('/contact').middleware());

app.use(auth.prefix('/auth').middleware());
app.use(logs.prefix('/logs').middleware());
app.use(institutions.prefix('/institutions').middleware());
app.use(customFields.prefix('/custom-fields').middleware());
app.use(harvests.prefix('/harvests').middleware());
app.use(harvestsSessions.prefix('/harvests-sessions').middleware());
app.use(sushi.prefix('/sushi').middleware());
app.use(sushiEndpoints.prefix('/sushi-endpoints').middleware());
app.use(sushiAlerts.prefix('/sushi-alerts').middleware());
app.use(tasks.prefix('/tasks').middleware());
app.use(taskLogs.prefix('/task-logs').middleware());
app.use(opendata.prefix('/opendata').middleware());
app.use(users.prefix('/users').middleware());
app.use(roles.prefix('/roles').middleware());
app.use(memberships.prefix('/memberships').middleware());
app.use(testUsers.prefix('/test-users').middleware());
app.use(dashboards.prefix('/dashboards').middleware());
app.use(spaces.prefix('/spaces').middleware());
app.use(indices.prefix('/indices').middleware());
app.use(repositories.prefix('/repositories').middleware());
app.use(repositoryAliases.prefix('/repository-aliases').middleware());
app.use(repositoryAliasTemplates.prefix('/repository-alias-templates').middleware());
app.use(kibanaSpaces.prefix('/kibana-spaces').middleware());
app.use(esRoles.prefix('/elastic-roles').middleware());
app.use(queues.prefix('/queues').middleware());
app.use(kibana.prefix('/kibana').middleware());
app.use(actions.prefix('/actions').middleware());
app.use(activity.prefix('/activity').middleware());
app.use(sync.prefix('/sync').middleware());
app.use(apiKeys.prefix('/api-keys').middleware());

app.use(kibanaBridge.prefix('/_kbb').middleware());

module.exports = app;
