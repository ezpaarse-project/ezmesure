const Koa = require('koa');
const mount = require('koa-mount');
const cors = require('@koa/cors');
const { port, cron } = require('config');
const { CronJob } = require('cron');

const logger = require('./lib/logger');
const roles = require('./lib/services/roles');
const indexes = require('./lib/services/indexes');
const activity = require('./lib/services/activity');
const controller = require('./lib/controllers');
const puppeteer = require('./lib/services/puppeteer');
const { generatePendingReports } = require('./lib/services/reporting');
const elastic = require('./lib/services/elastic');

const env = process.env.NODE_ENV || 'development';

// check if roles exists
roles.findOrCreate();

// check if indexes exists
indexes.findOrCreate();

// try if puppeteer can be launched
puppeteer.testPuppeteer();

// CronTab for reporting job
const job = new CronJob({
  cronTime: cron,
  runOnInit: true,
  onTick: () => {
    generatePendingReports();
  },
});
job.start();

const app = new Koa();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: ['Content-Type', 'Authorization'],
}));

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
  logger.info(JSON.stringify({
    ...ctx.httpLog,
    user: ctx.query && ctx.query.user,
    status: ctx.status,
  }));

  ctx.httpLog.query = ctx.request.query;

  if (ctx.action) {
    try {
      await activity.save(ctx);
    } catch (e) {
      ctx.app.emit('error', e, ctx);
    }
  }
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    ctx.status = error.status || 500;

    if (ctx.status >= 500) {
      ctx.app.emit('error', error, ctx, false);
    }

    if (ctx.headerSent || !ctx.writable) { return; }

    ctx.type = 'json';

    if (env !== 'development') {
      ctx.body = {
        statusCode: ctx.status,
        error: error.message,
      };
      return;
    }

    ctx.body = {
      statusCode: ctx.status,
      error: error.message,
      stack: error.stack,
      code: error.code,
    };
  }
});

app.on('error', (err, ctx = {}) => {
  const url = ctx.request ? ctx.request.originalUrl : '';

  logger.error(`url=${url}, status=${ctx.status}, error=${err.message}, stack=${err.stack}`);
});

app.use(mount('/', controller));

function start() {
  const server = app.listen(port || 3000);
  server.setTimeout(1000 * 60 * 30);

  logger.info(`API server listening on port ${port || 3000}`);
  logger.info('Press CTRL+C to stop server');

  const closeApp = () => {
    logger.info('Got Signal, closing the server');
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', closeApp);
  process.on('SIGTERM', closeApp);
}

async function waitForElasticsearch() {
  logger.info('Waiting for Elasticsearch...');

  for (let i = 0; i < 10; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const { body } = await elastic.cluster.health({ waitForStatus: 'yellow', timeout: '20s' });
      const status = body && body.status;

      if (status === 'yellow' || status === 'green') {
        logger.info(`Elasticsearch is ready (status: ${status || 'unknown'})`);
        return;
      }

      logger.info(`Elasticsearch not ready yet (status: ${status})`);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (e) {
      const status = (e.meta && e.meta.body && e.meta.body.status);

      if (typeof status === 'string') {
        logger.info(`Elasticsearch not ready yet (status: ${status || 'unknown'})`);
      } else {
        logger.info(`Cannot connect to Elasticsearch yet : ${e.message}`);
      }

      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  logger.error('Elasticsearch does not respond or is in a bad state');
  throw new Error('Elasticsearch does not respond');
}

waitForElasticsearch()
  .then(start)
  .catch(() => {
    logger.error('Error during bootstrap, shutting down...');
    process.exit(1);
  });
