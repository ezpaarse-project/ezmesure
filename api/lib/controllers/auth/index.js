const router = require('koa-joi-router')();

const { requireJwt, requireUser } = require('../../services/auth');

const {
  standardMembershipsQueryParams,
  standardElasticRolesQueryParams,

  getCurrentUser,
  getCurrentUserAppToken,
  getCurrentUserReportingToken,
  getCurrentUserMemberships,
  getCurrentUserElasticRoles,
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

module.exports = router;
