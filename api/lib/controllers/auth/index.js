const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { bodyParser } = require('@koa/bodyparser');

const { requireJwt, requireUser } = require('../../services/auth');

const {
  standardMembershipsQueryParams,
  standardElasticRolesQueryParams,
  getToken,
  getUser,
  getResetToken,
  deleteUser,
  resetPassword,
  changePassword,
  changeExcludeNotifications,
  getMemberships,
  getElasticRoles,
  getReportingToken,
  activate,
} = require('./auth');

const { NOTIFICATION_KEYS } = require('../../utils/notifications/constants');

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
      password: Joi.string().trim().min(6).required(),
      token: Joi.string().trim().required(),
    }),
  },
});

router.use(requireJwt, requireUser);

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

router.route({
  method: 'DELETE',
  path: '/',
  handler: deleteUser,
});

router.get('/reporting_token', getReportingToken);
router.route({
  method: 'GET',
  path: '/memberships',
  handler: getMemberships,
  validate: {
    query: standardMembershipsQueryParams.manyValidation,
  },
});
router.route({
  method: 'GET',
  path: '/elastic-roles',
  handler: getElasticRoles,
  validate: {
    query: standardElasticRolesQueryParams.manyValidation,
  },
});
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
      actualPassword: Joi.string().required().trim().min(1),
      password: Joi.string().trim().min(6).required(),
    }),
  },
});
router.route({
  method: 'PUT',
  path: '/excludeNotifications',
  handler: [
    bodyParser(),
    changeExcludeNotifications,
  ],
  validate: {
    type: 'json',
    body: Joi.array().items(
      Joi.string().valid(...NOTIFICATION_KEYS),
    ),
  },
});

module.exports = router;
