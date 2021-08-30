const router = require('koa-joi-router')();
const bodyParser = require('koa-bodyparser');

const { requireJwt, requireUser } = require('../../services/auth');

const {
  resetPassword, getToken, getUser, acceptTerms,
} = require('./auth');

router.post('/password/reset', bodyParser(), resetPassword);

router.use(requireJwt, requireUser);

router.get('/', getUser);
router.get('/token', getToken);
router.post('/terms/accept', acceptTerms);

module.exports = router;
