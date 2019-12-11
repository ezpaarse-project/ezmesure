const router = require('koa-joi-router')();
const { requireJwt } = require('../../services/auth');
const { list, refresh } = require('./actions');


router.get('/', list);
router.use(requireJwt);
router.post('/refresh', refresh);

module.exports = router;
