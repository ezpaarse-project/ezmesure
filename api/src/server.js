'use strict';

const env = process.env.NODE_ENV || 'development';

import path from 'path';
import koa from 'koa';
import mount from 'koa-mount';
import cors from 'koa-cors';
import qs from 'koa-qs';
import config from 'config';

import logger from './lib/services/logger';
import elasticsearch from './lib/services/elastic';
import mongo from './lib/services/mongo';
import controller from './lib/controllers';

const appLogger  = logger(config.get('logs.app'));
const httpLogger = logger(config.get('logs.http'));

const app = koa();
qs(app);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  headers: ['Content-Type', 'Authorization']
}));

// Server logs
app.use(function* logHttp(next) {
  this.httpLog = {
    method: this.request.method,
    url: this.request.url,
    remoteIP: this.request.ip,
    userAgent: this.request.headers['user-agent']
  };

  yield next;

  // Static files
  if (['.css', '.js', '.woff'].indexOf(path.extname(this.request.url)) !== -1) { return; }

  this.httpLog.status = this.status;
  httpLogger.log('info', this.httpLog);
});

// Error handler
app.use(function *(next) {
  try {
    yield next;
  } catch (error) {
    this.status = error.status || 500;
    this.app.emit('error', error, this);

    if (this.headerSent || !this.writable) { return; }

    if (env !== 'development') {
      return this.body = error.message;
    }

    // respond with the error details
    this.type = 'json';
    this.body = {
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

const mongoCfg = config.get('mongo');

mongo.connect(`mongodb://${mongoCfg.host}:${mongoCfg.port}/${mongoCfg.db}`, err => {
  if (err) {
    appLogger.error('Couldn\'t connect to Mongodb');
    process.exit(1);
  }
});

const server = app.listen(config.port);
server.setTimeout(1000 * 60 * 30);

appLogger.info(`API server listening on port ${config.port}`);
appLogger.info('Press CTRL+C to stop server');

process.on('SIGINT', closeApp);
process.on('SIGTERM', closeApp);

function closeApp() {
  appLogger.info(`Got Signal, closing the server`);
  server.close(() => {
    mongo.disconnect(() => {
      process.exit(0);
    });
  });
}

