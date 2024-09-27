const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { FEATURES } = require('../../../entities/memberships.dto');

const {
  requireJwt,
  requireUser,
  fetchInstitution,
  requireMemberPermissions,
} = require('../../../services/auth');

const {
  standardQueryParams,

  getAll,
  getMetrics,
} = require('./actions');

router.use(requireJwt, requireUser);

router.route({
  method: 'GET',
  path: '/',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.sushi.read),
    getAll,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
    query: standardQueryParams.manyValidation.append({
      connection: Joi.string().allow('working', 'success', 'unauthorized', 'failed', 'faulty', 'untested'),
      q: Joi.string().trim().allow(''),
    }),
  },
});

router.route({
  method: 'GET',
  path: '/_metrics',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.sushi.read),
    getMetrics,
  ],
});

module.exports = router;
