const router = require('koa-joi-router')();

const { getConfig } = require('./actions');

router.route({
  method: 'GET',
  path: '/',
  handler: getConfig,
});

module.exports = router;
