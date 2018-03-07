'use strict';

const env = process.env.NODE_ENV || 'development';

const path   = require('path');
const Koa    = require('koa');
const mount  = require('koa-mount');
const cors   = require('koa-cors');
const config = require('config');

const logger     = require('./lib/services/logger');
const appLogger  = logger(config.get('logs.app'));
const httpLogger = logger(config.get('logs.http'));

module.exports = { appLogger };

const mailSender = config.get('notifications.sender');

if (mailSender) {
  appLogger.info(`Sender address for mails: ${mailSender}`);
} else {
  appLogger.error('Missing sender address for mails, please configure <notifications.sender>');
}

const elasticsearch = require('./lib/services/elastic');
const controller    = require('./lib/controllers');

const app = new Koa();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  headers: ['Content-Type', 'Authorization']
}));

// Server logs
app.use(async (ctx, next) => {
  ctx.httpLog = {
    method: ctx.request.method,
    url: ctx.request.url,
    remoteIP: ctx.request.ip,
    userAgent: ctx.request.headers['user-agent']
  };

  await next();

  // Static files
  if (['.css', '.js', '.woff'].indexOf(path.extname(ctx.request.url)) !== -1) { return; }

  ctx.httpLog.status = ctx.status;
  httpLogger.log('info', ctx.httpLog);
});

// Error handler
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    ctx.status = error.status || 500;
    ctx.app.emit('error', error, ctx);

    if (ctx.headerSent || !ctx.writable) { return; }

    if (env !== 'development') {
      return ctx.body = { error: error.message };
    }

    // respond with the error details
    ctx.type = 'json';
    ctx.body = {
      error: error.message,
      stack: error.stack,
      code: error.code
    };
  }
});

// Error logging
app.on('error', (err, ctx = {}) => {
  const errorDetails = {
    status: ctx.status,
    error: err.message,
    stack: err.stack,
    err
  };

  appLogger.log('error', ctx.request ? ctx.request.originalUrl : '', errorDetails);
});

app.use(mount('/', controller));

const server = app.listen(config.port);
server.setTimeout(1000 * 60 * 30);

appLogger.info(`API server listening on port ${config.port}`);
appLogger.info('Press CTRL+C to stop server');

process.on('SIGINT', closeApp);
process.on('SIGTERM', closeApp);

function closeApp() {
  appLogger.info(`Got Signal, closing the server`);
  server.close(() => {
    process.exit(0);
  });
}
