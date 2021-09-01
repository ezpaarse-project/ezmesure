const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const bodyParser = require('koa-bodyparser');

const { requireJwt, requireUser } = require('../../services/auth');

const {
  getToken,
  getUser,
  acceptTerms,
  getResetToken,
  resetPassword,
  changePassword,
} = require('./auth');

router.route({
  method: 'POST',
  path: '/password/_get_token',
  handler: [
    bodyParser(),
    getResetToken,
  ],
  validate: {
    type: 'json',
    body: {
      username: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/password/_reset',
  handler: [
    bodyParser(),
    resetPassword,
  ],
  validate: {
    type: 'json',
    body: {
      token: Joi.string().trim().required(),
      password: Joi.string().trim().required(),
      passwordRepeat: Joi.string().trim().equal(Joi.ref('password')).required(),
    },
  },
});

router.use(requireJwt, requireUser);

router.get('/', getUser);
router.get('/token', getToken);
router.post('/terms/accept', acceptTerms);
router.put('/password', changePassword);

module.exports = router;
