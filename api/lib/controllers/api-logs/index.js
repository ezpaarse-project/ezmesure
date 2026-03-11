const router = require('koa-joi-router')();

const { requireJwt, requireUser, requireAdmin } = require('../../services/auth');

const { getStream, getLatest } = require('./actions');

router.use(requireJwt, requireUser, requireAdmin);

router.route({
  method: 'GET',
  path: '/',
  handler: getLatest,
});

router.route({
  method: 'GET',
  path: '/sse',
  handler: getStream,
});

module.exports = router;
