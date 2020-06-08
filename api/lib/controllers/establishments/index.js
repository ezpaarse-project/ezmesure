const router = require('koa-joi-router')();
const koaBody = require('koa-body');

const { requireJwt, requireUser } = require('../../services/auth');

const {
  getEtablishments,
  storeEstablishment,
  deleteEstablishments,
  getEtablishment,
  updateEstablishment, 
  updateCorrespondent,
  getCorrespondents,
  addSushi,
  updateSushi,
  getSushiData,
  deleteSushiData,
  pictures,
} = require('./actions');

router.get('/pictures/:id', pictures);

router.use(requireJwt, requireUser);

router.get('/', getEtablishments);

router.get('/:email', getEtablishment);
router.post('/', koaBody({
  multipart: true,
  uploadDir: './uploads/',
}), storeEstablishment);
router.patch('/:establishmentId', koaBody({
  multipart: true,
  uploadDir: './uploads/',
}), updateEstablishment);
router.post('/:establishmentId/delete', koaBody(), deleteEstablishments);

router.get('/correspondents/:email', getCorrespondents);
router.patch('/:establishmentId/correspondent/:email', koaBody(), updateCorrespondent);

router.get('/sushi/:email', koaBody(), getSushiData);
router.post('/:establishmentId/sushi', koaBody(), addSushi);
router.patch('/:establishmentId/sushi', koaBody(), updateSushi);
router.post('/:establishmentId/sushi/delete', koaBody(), deleteSushiData);

module.exports = router;
