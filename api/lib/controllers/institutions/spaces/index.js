const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { FEATURES } = require('../../../entities/memberships.dto');

const {
  requireActiveJwt,
  requireUser,
  fetchInstitution,
  requireMemberPermissions,
} = require('../../../services/auth');

const {
  standardQueryParams,

  getInstitutionSpaces,
} = require('./actions');

router.use(requireActiveJwt, requireUser);

router.route({
  method: 'GET',
  path: '/',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.memberships.read),
    getInstitutionSpaces,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
    query: standardQueryParams.manyValidation,
  },
});

module.exports = router;
