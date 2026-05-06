const router = require('koa-joi-router')();

const { requireActiveJwt, requireUser, requireAdmin } = require('../../services/auth');

const { getStream, getLatest } = require('./actions');

router.use(requireActiveJwt, requireUser, requireAdmin);

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
