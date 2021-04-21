const router = require('koa-joi-router')();
const { requireJwt, requireUser } = require('../../services/auth');
const { list } = require('./actions');

router.use(requireJwt, requireUser);

router.get('/', list);

module.exports = router;
