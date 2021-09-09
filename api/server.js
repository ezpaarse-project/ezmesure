
const env = process.env.NODE_ENV || 'development';

const Koa = require('koa');
const mount = require('koa-mount');
const cors = require('koa-cors');
const config = require('config');
const path = require('path');
const { STATUS_CODES } = require('http');

const i18n = require('./lib/services/i18n');
const metrics = require('./lib/services/metrics');
const notifications = require('./lib/services/notifications');
const depositors = require('./lib/services/depositors');
const opendata = require('./lib/services/opendata');
const elastic = require('./lib/services/elastic');

const { appLogger, httpLogger } = require('./lib/services/logger');

module.exports = { appLogger };

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
      };
      return;
    }

    // respond with the error details in dev env
    ctx.type = 'json';
    ctx.body = {
      status: ctx.status,
      error: error.message,
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
  depositors.start(appLogger);
  opendata.startCron(appLogger);

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
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (e) {
      const status = (e.meta && e.meta.body && e.meta.body.status);

      if (typeof status === 'string') {
        appLogger.info(`Elasticsearch not ready yet (status: ${status || 'unknown'})`);
      } else {
        appLogger.info(`Cannot connect to Elasticsearch yet : ${e.message}`);
      }

      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  appLogger.error('Elasticsearch does not respond or is in a bad state');
  throw new Error('Elasticsearch does not respond');
}

async function createAdmin() {
  const username = config.get('admin.username');
  const password = config.get('admin.password');

  if (!username || !password) { return; }

  appLogger.info(`Creating or updating admin user [${username}]`);

  try {
    await elastic.security.putUser({
      username,
      refresh: true,
      body: {
        password,
        full_name: 'ezMESURE Administrator',
        roles: ['superuser'],
        metadata: {
          acceptedTerms: true,
        },
      },
    });
  } catch (e) {
    appLogger.error(`Failed to create admin : ${e.message}`);
  }
}

waitForElasticsearch()
  .then(createAdmin)
  .then(start)
  .catch(() => {
    appLogger.error('Error during bootstrap, shutting down...');
    process.exit(1);
  });
