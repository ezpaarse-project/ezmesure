const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { FEATURES } = require('../../../entities/memberships.dto');
const { adminCreateOrConnectSchema } = require('../../../entities/repository-aliases.dto');

const {
  requireJwt,
  requireUser,
  fetchInstitution,
  fetchRepositoryAlias,
  requireMemberPermissions,
  requireAdmin,
} = require('../../../services/auth');

const {
  standardQueryParams,

  getInstitutionRepositoryAliases,
  upsertRepositoryAliasAllPermission,
  upsertRepositoryAliasPermission,
  deleteRepositoryAliasPermission,
  removeRepositoryAlias,
  addRepositoryAlias,
} = require('./actions');

router.use(requireJwt, requireUser);

router.route({
  method: 'GET',
  path: '/',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.memberships.read),
    getInstitutionRepositoryAliases,
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
    fetchRepositoryAlias({ include: { institutions: true } }),
    removeRepositoryAlias,
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
    fetchRepositoryAlias({ ignoreNotFound: true }),
    addRepositoryAlias,
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
    fetchRepositoryAlias(),
    upsertRepositoryAliasAllPermission,
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
    fetchRepositoryAlias(),
    upsertRepositoryAliasPermission,
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
    fetchRepositoryAlias(),
    deleteRepositoryAliasPermission,
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
