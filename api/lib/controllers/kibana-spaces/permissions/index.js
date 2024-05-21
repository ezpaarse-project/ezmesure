const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { FEATURES } = require('../../../entities/memberships.dto');

const {
  requireJwt,
  requireUser,
  fetchInstitution,
  fetchSpace,
  requireMemberPermissions,
} = require('../../../services/auth');

const {
  standardQueryParams,

  getSpacePermissions,
  upsertSpaceAllPermission,
  upsertPermission,
  deletePermission,
} = require('./actions');

router.use(requireJwt, requireUser);

router.route({
  method: 'GET',
  path: '/',
  handler: [
    fetchSpace(),
    fetchInstitution({ getId: (ctx) => ctx?.state?.space?.institutionId }),
    requireMemberPermissions(FEATURES.memberships.read),
    getSpacePermissions,
  ],
  validate: {
    params: {
      spaceId: Joi.string().trim().required(),
    },
    query: standardQueryParams.manyValidation,
  },
});

router.route({
  method: 'PUT',
  path: '/',
  handler: [
    fetchSpace(),
    fetchInstitution({ getId: (ctx) => ctx?.state?.space?.institutionId }),
    requireMemberPermissions(FEATURES.memberships.write),
    upsertSpaceAllPermission,
  ],
  validate: {
    type: 'json',
    params: {
      spaceId: Joi.string().trim().required(),
    },
    body: Joi.array().items(Joi.object()),
  },
});

router.route({
  method: 'PUT',
  path: '/:username',
  handler: [
    fetchSpace(),
    fetchInstitution({ getId: (ctx) => ctx?.state?.space?.institutionId }),
    requireMemberPermissions(FEATURES.memberships.write),
    upsertPermission,
  ],
  validate: {
    type: 'json',
    params: {
      spaceId: Joi.string().trim().required(),
      username: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:username',
  handler: [
    fetchSpace(),
    fetchInstitution({ getId: (ctx) => ctx?.state?.space?.institutionId }),
    requireMemberPermissions(FEATURES.memberships.write),
    deletePermission,
  ],
  validate: {
    params: {
      spaceId: Joi.string().trim().required(),
      username: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
