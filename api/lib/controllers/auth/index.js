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
  getMemberships,
  getReportingToken,
} = require('./auth');

const schema = {
  password: Joi.string().trim().min(6).required(),
  passwordRepeat: Joi.string().trim().min(6).equal(Joi.ref('password')).required(),
};

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
    body: Joi.object({
      token: Joi.string().trim().required(),
      ...schema,
    }),
  },
});

router.use(requireJwt, requireUser);

router.get('/', getUser);
router.get('/reporting_token', getReportingToken);
router.get('/memberships', getMemberships);
router.get('/token', getToken);
router.post('/terms/accept', acceptTerms);
router.route({
  method: 'PUT',
  path: '/password',
  handler: [
    bodyParser(),
    changePassword,
  ],
  validate: {
    type: 'json',
    body: Joi.object(schema),
  },
});

module.exports = router;
