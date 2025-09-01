const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { FEATURES } = require('../../../entities/memberships.dto');
const { adminCreateOrConnectSchema } = require('../../../entities/repositories.dto');

const {
  requireJwt,
  requireUser,
  fetchInstitution,
  fetchRepository,
  requireMemberPermissions,
  requireAdmin,
} = require('../../../services/auth');

const {
  standardQueryParams,

  getInstitutionRepositories,
  upsertRepositoryAllPermission,
  upsertRepositoryPermission,
  deleteRepositoryPermission,
  removeRepository,
  addRepository,
} = require('./actions');

router.use(requireJwt, requireUser);

router.route({
  method: 'GET',
  path: '/',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.institution.read),
    getInstitutionRepositories,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
    query: standardQueryParams.manyValidation,
  },
});

router.route({
  method: 'DELETE',
  path: '/:pattern',
  handler: [
    requireAdmin,
    fetchInstitution(),
    fetchRepository({ include: { institutions: true } }),
    removeRepository,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
      pattern: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'PUT',
  path: '/:pattern',
  handler: [
    requireAdmin,
    fetchInstitution(),
    fetchRepository({ ignoreNotFound: true }),
    addRepository,
  ],
  validate: {
    type: 'json',
    body: adminCreateOrConnectSchema,
    params: {
      institutionId: Joi.string().trim().required(),
      pattern: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'PUT',
  path: '/:pattern/permissions',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.memberships.write),
    fetchRepository(),
    upsertRepositoryAllPermission,
  ],
  validate: {
    type: 'json',
    params: {
      institutionId: Joi.string().trim().required(),
      pattern: Joi.string().trim().required(),
    },
    body: Joi.array().items(Joi.object()),
  },
});

router.route({
  method: 'PUT',
  path: '/:pattern/permissions/:username',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.memberships.write),
    fetchRepository(),
    upsertRepositoryPermission,
  ],
  validate: {
    type: 'json',
    params: {
      institutionId: Joi.string().trim().required(),
      pattern: Joi.string().trim().required(),
      username: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:pattern/permissions/:username',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.memberships.write),
    fetchRepository(),
    deleteRepositoryPermission,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
      pattern: Joi.string().trim().required(),
      username: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
