const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { bodyParser } = require('@koa/bodyparser');

const { requireJwt, requireUser, requireAdmin } = require('../../services/auth');

const {
  getToken,
  getUser,
  getResetToken,
  resetPassword,
  changePassword,
  getMemberships,
  getReportingToken,
  activate,
  impersonateUser,
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

router.use(requireJwt, requireUser);

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
      password: Joi.string().trim().min(6).required(),
    }),
  },
});

router.route({
  method: 'POST',
  path: '/_activate',
  handler: [
    bodyParser(),
    activate,
  ],
  validate: {
    type: 'json',
    body: Joi.object({
      password: Joi.string().trim().min(6).required(),
      acceptTerms: Joi.boolean().valid(true).required(),
    }),
  },
});

router.get('/', getUser);
router.get('/reporting_token', getReportingToken);
router.get('/memberships', getMemberships);
router.get('/token', getToken);
router.route({
  method: 'PUT',
  path: '/password',
  handler: [
    bodyParser(),
    changePassword,
  ],
  validate: {
    type: 'json',
    body: Joi.object({
      password: Joi.string().trim().min(6).required(),
    }),
  },
});

router.use(requireAdmin);

router.route({
  method: 'POST',
  path: '/:username/_impersonate',
  handler: impersonateUser,
  validate: {
    params: {
      username: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
