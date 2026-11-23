const { setTemporaryLevel, getLevels, getLevel } = require('../../services/logger');

/**
 * Get the current logging levels
 * @param {import('koa').Context} ctx - The koa context
 */
exports.getLoggingLevel = async (ctx) => {
  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = {
    level: getLevel('app'),
    levels: getLevels('app'),
  };
};

/**
 * Change the logging level
 * @param {import('koa').Context} ctx - The koa context
 */
exports.setLoggingLevel = async (ctx) => {
  const { body = {} } = ctx.request;

  setTemporaryLevel('app', body.value, body.duration);

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = {
    level: getLevel('app'),
  };
};
