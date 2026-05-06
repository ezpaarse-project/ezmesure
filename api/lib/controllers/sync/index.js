const router = require('koa-joi-router')();

const { requireActiveJwt, requireUser, requireAdmin } = require('../../services/auth');
const {
  startSync,
  getSyncStatus,
} = require('./actions');

router.use(requireActiveJwt, requireUser, requireAdmin);

router.route({
  method: 'POST',
  path: '/_start',
  handler: startSync,
});

router.route({
  method: 'GET',
  path: '/',
  handler: getSyncStatus,
});

module.exports = router;
