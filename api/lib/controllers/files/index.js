const router = require('koa-joi-router')();
const bodyParser = require('@koa/bodyparser');

const { requireJwt, requireUser, requireTermsOfUse } = require('../../services/auth');

const {
  list, deleteOne, deleteMany, upload,
} = require('./actions');

router.use(requireJwt, requireUser, requireTermsOfUse);

router.get('/', list);
router.put('/:fileName', upload);
router.delete('/:fileName', deleteOne);

router.use(bodyParser());
router.post('/delete_batch', deleteMany);

module.exports = router;
