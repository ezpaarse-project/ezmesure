const router = require('koa-joi-router')();

const { requireJwt, requireUser } = require('../../services/auth');

const {
  resetPassword, getToken, getUser, acceptTerms,
} = require('./auth');

router.use(requireJwt, requireUser);

router.get('/', getUser);
router.get('/token', getToken);
router.post('/terms/accept', acceptTerms);
router.post('/password/reset', resetPassword);

module.exports = router;
