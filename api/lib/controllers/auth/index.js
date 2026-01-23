const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const { bodyParser } = require('@koa/bodyparser');

const { requireJwt, requireUser } = require('../../services/auth');

const { NOTIFICATION_KEYS } = require('../../utils/notifications/constants');

const {
  standardMembershipsQueryParams,
  standardElasticRolesQueryParams,
  getCurrentUser,
  getCurrentUserAppToken,
  getCurrentUserReportingToken,
  getCurrentUserMemberships,
  getCurrentUserElasticRoles,
  deleteCurrentUser,
  changeExcludeNotifications,
} = require('./actions');

// Sub routes

const oauth = require('./oauth');
const activate = require('./activate');
const apiKeys = require('./api-keys');

router.use(oauth.prefix('/oauth').middleware());
router.use(activate.prefix('/_activate').middleware());
router.use(apiKeys.prefix('/api-keys').middleware());

// Global middlewares

router.use(requireJwt, requireUser);

// Routes

router.route({
  method: 'GET',
  path: '/',
  handler: [
    getCurrentUser,
  ],
});

router.route({
  method: 'DELETE',
  path: '/',
  handler: [
    deleteCurrentUser,
  ],
});

router.route({
  method: 'GET',
  path: '/token',
  handler: [
    getCurrentUserAppToken,
  ],
});

router.route({
  method: 'GET',
  path: '/reporting_token',
  handler: [
    getCurrentUserReportingToken,
  ],
});

router.route({
  method: 'GET',
  path: '/memberships',
  handler: [
    getCurrentUserMemberships,
  ],
  validate: {
    query: standardMembershipsQueryParams.manyValidation,
  },
});

router.route({
  method: 'GET',
  path: '/elastic-roles',
  handler: getCurrentUserElasticRoles,
  validate: {
    query: standardElasticRolesQueryParams.manyValidation,
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
