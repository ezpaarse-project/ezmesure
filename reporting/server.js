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
const { generatePendingReports } = require('./lib/services/reporting');

const env = process.env.NODE_ENV || 'development';

// // check if roles exists
roles.findOrCreate();

// // check if indexes exists
indexes.findOrCreate();

// CronTab for reporting job
const job = new CronJob(cron, () => {
  generatePendingReports();
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

const server = app.listen(port || 3000);

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
