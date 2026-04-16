const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const { bodyParser } = require('@koa/bodyparser');

const { requireActiveJwt, requireUser } = require('../../services/auth');

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
  deleteCurrentUser,
  changeExcludeNotifications,
  joinInstitution,
  leaveInstitution,
} = require('./actions');

router.use(oauth.prefix('/oauth').middleware());
router.use(activate.prefix('/_activate').middleware());

router.use(requireActiveJwt, requireUser);

const { NOTIFICATION_KEYS } = require('../../utils/notifications/constants');

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
  method: 'PUT',
  path: '/memberships/:institutionId',
  handler: joinInstitution,
});

router.route({
  method: 'DELETE',
  path: '/memberships/:institutionId',
  handler: leaveInstitution,
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
