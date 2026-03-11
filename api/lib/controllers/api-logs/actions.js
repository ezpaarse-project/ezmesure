const config = require('config');
const { PassThrough } = require('node:stream');
const { appLogger } = require('../../services/logger');

const maxSSEPoolSize = config.get('logs.sse.maxPoolSize');
const heartbeatInterval = config.get('logs.sse.heartbeatInterval');

const ssePool = new Set();
const bufferedTransport = appLogger.transports.find((t) => t.name === 'buffered');

bufferedTransport.on('logged', (info) => {
  ssePool.forEach((stream) => {
    stream.write(`data: ${JSON.stringify(info)}\n\n`);
  });
});

/**
 * Get the latest logs that currently live in the buffer
 * @param {import('koa').Context} ctx - The koa context
 */
exports.getLatest = async (ctx) => {
  ctx.type = 'json';
  ctx.body = bufferedTransport.getLogs();
};

/**
 * Get a live stream of logs in the form of Server Sent Events
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
 *
 * @param {import('koa').Context} ctx - The koa context
 */
exports.getStream = async (ctx) => {
  if (ssePool.size > maxSSEPoolSize) {
    ctx.throw(429, ctx.$t('errors.logs.tooManySSEConnections'));
  }

  ctx.status = 200;
  ctx.set('Content-Type', 'text/event-stream');
  ctx.set('Cache-Control', 'no-cache');
  ctx.set('Connection', 'keep-alive');
  ctx.set('X-Accel-Buffering', 'no');

  const stream = new PassThrough();
  let heartbeatId;

  ssePool.add(stream);

  const closeStream = () => {
    clearInterval(heartbeatId);
    stream.end();
    ssePool.delete(stream);
  };

  /**
   * Send a heartbeat to help keeping the connection alive and detecting disconnections
   */
  const sendHeartbeat = () => {
    stream.write(': heartbeat\n\n');
  };

  ctx.req.on('close', closeStream);

  ctx.body = stream;

  stream.write(': ok\n\n');

  heartbeatId = setInterval(sendHeartbeat, heartbeatInterval);
};
