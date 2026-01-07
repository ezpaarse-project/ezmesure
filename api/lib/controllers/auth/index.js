const router = require('koa-joi-router')();

const { requireJwt, requireUser } = require('../../services/auth');

const oauth = require('./oauth');
const activate = require('./activate');

const {
  standardMembershipsQueryParams,
  standardElasticRolesQueryParams,

  getCurrentUser,
  getCurrentUserAppToken,
  getCurrentUserReportingToken,
  getCurrentUserMemberships,
  getCurrentUserElasticRoles,
} = require('./actions');

router.use(oauth.prefix('/oauth').middleware());
router.use(activate.prefix('/_activate').middleware());

router.use(requireJwt, requireUser);

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
