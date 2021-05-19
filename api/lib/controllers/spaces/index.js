const router = require('koa-joi-router')();
const { requireJwt, requireUser, requireAnyRole } = require('../../services/auth');
const { list } = require('./actions');

router.use(requireJwt, requireUser, requireAnyRole(['admin', 'superuser']));

router.route({
  method: 'GET',
  path: '/',
  handler: list,
});

module.exports = router;
