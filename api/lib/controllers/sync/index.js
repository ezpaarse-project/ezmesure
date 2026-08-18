const router = require('koa-joi-router')();

const { requireActiveAuth, requireUser, requireAdmin } = require('../../services/auth');
const {
  startSync,
  getSyncStatus,
} = require('./actions');

router.use(requireActiveAuth, requireUser, requireAdmin);

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
