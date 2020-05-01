const router = require('koa-joi-router')();
const koaBody = require('koa-body');

const { requireJwt, requireUser } = require('../../services/auth');

const {
  list,
  storeOrUpdate,
  deleteData,
  pictures,
  getOne,
} = require('./actions');

router.get('/pictures/:id', pictures);

router.use(requireJwt, requireUser);

router.get('/list', list);
router.get('/myestablishment', getOne);
router.post('/delete', koaBody(), deleteData);
router.post('/', koaBody({
  multipart: true,
  uploadDir: './uploads/',
}), storeOrUpdate);

module.exports = router;
