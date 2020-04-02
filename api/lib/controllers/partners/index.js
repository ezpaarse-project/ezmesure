const router = require('koa-joi-router')();
const { requireJwt } = require('../../services/auth');
const { list, refresh, pictures } = require('./actions');


router.get('/', list);
router.get('/pictures/:id', pictures);
router.use(requireJwt);
router.post('/refresh', refresh);

module.exports = router;
