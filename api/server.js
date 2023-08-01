const env = process.env.NODE_ENV || 'development';

const Koa = require('koa');
const mount = require('koa-mount');
const cors = require('koa-cors');
const config = require('config');
const path = require('path');
const { setTimeout } = require('timers/promises');
const { STATUS_CODES } = require('http');

const usersService = require('./lib/entities/users.service');

const i18n = require('./lib/services/i18n');
const metrics = require('./lib/services/metrics');
const notifications = require('./lib/services/notifications');
const Task = require('./lib/models/Task');
const opendata = require('./lib/services/opendata');
const elastic = require('./lib/services/elastic');

const ezreeportSync = require('./lib/services/sync/ezreeport');

const cronMetrics = require('./lib/controllers/metrics/cron');
const { appLogger, httpLogger } = require('./lib/services/logger');

const mailSender = config.get('notifications.sender');

if (mailSender) {
  appLogger.info(`Sender address for mails: ${mailSender}`);
} else {
  appLogger.error('Missing sender address for mails, please configure <notifications.sender>');
}

const controller = require('./lib/controllers');

const app = new Koa();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: ['Content-Type', 'Authorization'],
}));

i18n(app, {
  dir: path.resolve(__dirname, 'locales'),
  defaultLocale: 'en',
  cookieName: 'ezmesure_i18n',
});

// Server logs
app.use(async (ctx, next) => {
  ctx.httpLog = {
    method: ctx.request.method,
    url: ctx.request.url,
    remoteIP: ctx.request.ip,
    userAgent: ctx.request.headers['user-agent'],
  };

  ctx.startTime = Date.now();
  await next();
  ctx.responseTime = Date.now() - ctx.startTime;

  httpLogger.log('info', {
    ...ctx.httpLog,
    user: ctx.state && ctx.state.user && ctx.state.user.username,
    status: ctx.status,
  });

  ctx.httpLog.query = ctx.request.query;

  if (ctx.action) {
    try {
      await metrics.save(ctx);
    } catch (e) {
      ctx.app.emit('error', e, ctx);
    }
  }
});

// Error handler
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    ctx.status = error.status || 500;

    if (error?.name === 'ValidationError') {
      ctx.status = 400;
      error.expose = true;
    }

    if (ctx.status >= 500) {
      ctx.app.emit('error', error, ctx, false);
    }

    if (ctx.headerSent || !ctx.writable) { return; }

    if (env !== 'development') {
      let { message } = error;

      if (!error.expose) {
        message = STATUS_CODES[ctx.status] || STATUS_CODES[500];
      }

      ctx.body = {
        status: ctx.status,
        error: message,
        detail: error.detail,
      };
      return;
    }

    // respond with the error details in dev env
    ctx.type = 'json';
    ctx.body = {
      status: ctx.status,
      error: error.message,
      detail: error.detail,
      stack: error.stack,
      code: error.code,
    };
  }
});

// Error logging
app.on('error', (err, ctx = {}) => {
  const url = ctx.request ? ctx.request.originalUrl : '';

  appLogger.error(`url=${url}, status=${ctx.status}, error=${err.message}, stack=${err.stack}`);
});

app.use(mount('/', controller));

function start() {
  notifications.start(appLogger);
  opendata.startCron(appLogger);
  ezreeport.startCron();
  cronMetrics.start();

  // Change the status of tasks that was running when the server went down
  Task.interruptRunningTasks()
    .then(({ body = {} }) => {
      const { updated } = body;
      if (Number.isInteger(updated) && updated > 0) {
        appLogger.info(`${updated} running task(s) was marked as interrupted`);
      } else {
        appLogger.info('No running tasks were found');
      }
    }).catch((err) => {
      appLogger.error('Failed to change status of interrupted tasks');
      appLogger.error(err.message);
    });

  const server = app.listen(config.port);
  server.setTimeout(1000 * 60 * 30);

  appLogger.info(`API server listening on port ${config.port}`);
  appLogger.info('Press CTRL+C to stop server');

  function closeApp() {
    appLogger.info('Got Signal, closing the server');
    server.close(() => {
      process.exit(0);
    });
  }

  process.on('SIGINT', closeApp);
  process.on('SIGTERM', closeApp);
}

async function waitForElasticsearch() {
  appLogger.info('Waiting for Elasticsearch...');

  for (let i = 0; i < 10; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const { body } = await elastic.cluster.health({ waitForStatus: 'yellow', timeout: '20s' });
      const status = body && body.status;

      if (status === 'yellow' || status === 'green') {
        appLogger.info(`Elasticsearch is ready (status: ${status || 'unknown'})`);
        return;
      }

      appLogger.info(`Elasticsearch not ready yet (status: ${status})`);
    } catch (e) {
      const status = (e.meta && e.meta.body && e.meta.body.status);

      if (typeof status === 'string') {
        appLogger.info(`Elasticsearch not ready yet (status: ${status || 'unknown'})`);
      } else {
        appLogger.info(`Cannot connect to Elasticsearch yet : ${e.message}`);
      }
    }

    // eslint-disable-next-line no-await-in-loop
    await setTimeout(5000);
  }

  appLogger.error('Elasticsearch does not respond or is in a bad state');
  throw new Error('Elasticsearch does not respond');
}

async function createAdmin() {
  try {
    await usersService.createAdmin();
    appLogger.info('Admin user is created');
  } catch (err) {
    appLogger.error(`Cannot create admin user : ${err}`);
  }
}

async function setKibanaPassword() {
  const username = config.get('kibana.username');
  const password = config.get('kibana.password');

  if (!username || !password) { return; }

  appLogger.info(`Updating [${username}] password`);

  try {
    await elastic.security.changePassword({
      username,
      refresh: true,
      body: { password },
    });
  } catch (e) {
    appLogger.error(`Failed to update Kibana password : ${e.message}`);
  }
}

waitForElasticsearch()
  .then(createAdmin)
  .then(setKibanaPassword)
  .then(start)
  .catch((e) => {
    appLogger.error(e.message);
    appLogger.error(e.stack);
    appLogger.error('Error during bootstrap, shutting down...');
    process.exit(1);
  });
