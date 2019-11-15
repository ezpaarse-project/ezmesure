const router = require('koa-joi-router')();
const bodyParser = require('koa-bodyparser');

const { requireJwt, requireUser, requireTermsOfUse } = require('../../services/auth');

const {
  list, find, register, load, del, check,
} = require('./actions');

router.use(requireJwt, requireUser, requireTermsOfUse);

bodyParser();
router.get('/check', check);
router.get('/', list);
router.get('/:providerName', find);
router.delete('/:providerName', del);
router.put('/:providerName', register);
router.post('/:providerName', load);

module.exports = router;
