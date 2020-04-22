const router = require('koa-joi-router')();
const koaBody = require('koa-body');

const { requireJwt, requireUser } = require('../../services/auth');

const {
  list,
  storeData,
  updateData,
  deleteData,
  pictures,
} = require('./actions');

router.get('/pictures/:id', pictures);

router.use(requireJwt, requireUser);

router.get('/list', list);
router.post('/delete', koaBody(), deleteData);
router.put('/update', koaBody(), updateData);
router.post('/store', koaBody({
  multipart: true,
  uploadDir: './uploads/',
}), storeData);

module.exports = router;
