const router = require('koa-joi-router')();
const bodyParser = require('koa-bodyparser');

const { requireJwt, requireUser, requireTermsOfUse } = require('../../services/auth');

const {
  list, deleteIndice, deleteEvents, tops,
} = require('./basics');
const search = require('./search');
const upload = require('./upload');

router.use(requireJwt, requireUser, requireTermsOfUse);

router.get('/', list);
router.get('/:index/tops', tops);
router.delete('/:index', deleteIndice);
router.delete('/:index/events', deleteEvents);
router.post('/:index', upload);

router.use(bodyParser());
router.post('/:index/search', search);

module.exports = router;
