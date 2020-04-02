const router = require('koa-joi-router')();
const koaBody = require('koa-body');

const { requireJwt, requireUser } = require('../../services/auth');

const {
  storeData,
} = require('./correspondent');

router.use(requireJwt, requireUser);

router.use(koaBody({ multipart: true, uploadDir: './uploads/' }));
router.post('/', storeData);

module.exports = router;
