const Koa = require('koa');
const mount = require('koa-mount');
const cors = require('@koa/cors');
const { port, cron } = require('config');
const { CronJob } = require('cron');

const logger = require('./lib/logger');
const controller = require('./lib/controllers');
const reporting = require('./lib/services/reporting');

const env = process.env.NODE_ENV || 'development';

reporting();
const job = new CronJob('* * * * * *', () => {
  
});

const app = new Koa();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: ['Content-Type', 'Authorization'],
}));

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
      return ctx.body = { error: error.message };
    }

    ctx.type = 'json';
    ctx.body = {
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

job.start();

logger.info(`API server listening on port ${port || 3000}`);
logger.info('Press CTRL+C to stop server');

const closeApp = () => {
  logger.info('Got Signal, closing the server');
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', closeApp);
process.on('SIGTERM', closeApp);