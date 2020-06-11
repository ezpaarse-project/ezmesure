
const env = process.env.NODE_ENV || 'development';

const Koa = require('koa');
const mount = require('koa-mount');
const cors = require('koa-cors');
const config = require('config');

const metrics = require('./lib/services/metrics');
const logger = require('./lib/services/logger');
const notifications = require('./lib/services/notifications');

const appLogger = logger(config.get('logs.app'));
const httpLogger = logger(config.get('logs.http'));

module.exports = { appLogger };

const mailSender = config.get('notifications.sender');

if (mailSender) {
  appLogger.info(`Sender address for mails: ${mailSender}`);
} else {
  appLogger.error('Missing sender address for mails, please configure <notifications.sender>');
}

notifications.start(appLogger);

const controller = require('./lib/controllers');

const app = new Koa();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: ['Content-Type', 'Authorization'],
}));

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
      ctx.body = { error: error.message };
      return;
    }

    // respond with the error details in dev env
    ctx.type = 'json';
    ctx.body = {
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
