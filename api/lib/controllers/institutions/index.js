const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  includableFields: membershipIncludableFields,
  FEATURES,
} = require('../../entities/memberships.dto');
const {
  includableFields: repositoryIncludableFields,
  adminCreateOrConnectSchema,
} = require('../../entities/repositories.dto');
const {
  includableFields: spaceIncludableFields,
} = require('../../entities/repositories.dto');

const {
  requireJwt,
  requireUser,
  fetchInstitution,
  fetchRepository,
  requireAdmin,
  requireMemberPermissions,
} = require('../../services/auth');

const {
  standardQueryParams,

  getInstitutions,
  createInstitution,
  deleteInstitution,
  importInstitutions,
  getInstitution,
  getInstitutionMembers,
  addInstitutionMember,
  removeInstitutionMember,
  updateInstitution,
  getSushiData,
  getInstitutionContacts,
  getInstitutionMember,
  getInstitutionRepositories,
  getInstitutionSpaces,
  requestMembership,
} = require('./actions');

const {
  getSubInstitutions,
  addSubInstitution,
  removeSubInstitution,
} = require('./subinstitutions');

const {
  upsertRepositoryPermission,
  deleteRepositoryPermission,
  removeRepository,
  addRepository,
} = require('./repositories');

const {
  getInstitutionState,
  validateInstitution,
} = require('./admin');

router.use(requireJwt, requireUser);

router.route({
  method: 'GET',
  path: '/',
  handler: getInstitutions,
  validate: {
    query: standardQueryParams.manyValidation,
  },
});

router.route({
  method: 'GET',
  path: '/:institutionId/sushi',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.sushi.read),
    getSushiData,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
    query: Joi.object({
      latestImportTask: Joi.boolean().default(false),
      connection: Joi.string().valid('working', 'faulty', 'untested'),
      include: Joi.array().single().items(Joi.string().valid('harvests')),
    }).rename('include[]', 'include'),
  },
});

router.route({
  method: 'GET',
  path: '/:institutionId',
  handler: getInstitution,
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
    query: standardQueryParams.oneValidation,
  },

});

router.route({
  method: 'GET',
  path: '/:institutionId/repositories',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.memberships.read),
    getInstitutionRepositories,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
    query: Joi.object({
      include: Joi.array().single().items(Joi.string().valid(...repositoryIncludableFields)),
    }).rename('include[]', 'include'),
  },
});

router.route({
  method: 'PUT',
  path: '/:institutionId/repositories/:pattern/permissions/:username',
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
  path: '/:institutionId/repositories/:pattern/permissions/:username',
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

router.route({
  method: 'GET',
  path: '/:institutionId/spaces',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.memberships.read),
    getInstitutionSpaces,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
    query: Joi.object({
      include: Joi.array().single().items(Joi.string().valid(...spaceIncludableFields)),
    }).rename('include[]', 'include'),
  },
});

router.route({
  method: 'GET',
  path: '/:institutionId/memberships',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.memberships.read),
    getInstitutionMembers,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
    query: Joi.object({
      include: Joi.array().single().items(Joi.string().valid(...membershipIncludableFields)),
    }).rename('include[]', 'include'),
  },
});

router.route({
  method: 'GET',
  path: '/:institutionId/contacts',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.memberships.read),
    getInstitutionContacts,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:institutionId/memberships/:username',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.memberships.read),
    getInstitutionMember,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
      username: Joi.string().trim().required(),
    },
    query: Joi.object({
      include: Joi.array().single().items(Joi.string().valid(...membershipIncludableFields)),
    }).rename('include[]', 'include'),
  },
});

router.route({
  method: 'PUT',
  path: '/:institutionId/memberships/:username',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.memberships.write),
    addInstitutionMember,
  ],
  validate: {
    type: 'json',
    params: {
      institutionId: Joi.string().trim().required(),
      username: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:institutionId/memberships/:username',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.memberships.write),
    removeInstitutionMember,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
      username: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/:institutionId/_request_membership',
  handler: [
    requireUser,
    fetchInstitution(),
    requestMembership,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/',
  handler: createInstitution,
  validate: {
    type: 'json',
    maxBody: '3mb',
    query: {
      addAsMember: Joi.boolean(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/_import',
  handler: [
    importInstitutions,
  ],
  validate: {
    type: 'json',
    query: {
      overwrite: Joi.boolean().default(false),
    },
    body: Joi.array(),
  },
});

router.route({
  method: 'PUT',
  path: '/:institutionId',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.institution.write),
    updateInstitution,
  ],
  validate: {
    type: 'json',
    maxBody: '3mb',
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.use(requireAdmin);

router.route({
  method: 'DELETE',
  path: '/:institutionId',
  handler: [
    fetchInstitution(),
    deleteInstitution,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:institutionId/state',
  handler: [
    fetchInstitution(),
    getInstitutionState,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'PUT',
  path: '/:institutionId/validated',
  handler: [
    fetchInstitution(),
    validateInstitution,
  ],
  validate: {
    type: 'json',
    params: {
      institutionId: Joi.string().trim().required(),
    },
    body: {
      value: Joi.boolean().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:institutionId/subinstitutions',
  handler: [
    fetchInstitution(),
    getSubInstitutions,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'PUT',
  path: '/:institutionId/subinstitutions/:subInstitutionId',
  handler: [
    fetchInstitution(),
    addSubInstitution,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
      subInstitutionId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:institutionId/subinstitutions/:subInstitutionId',
  handler: [
    fetchInstitution(),
    removeSubInstitution,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
      subInstitutionId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:institutionId/repositories/:pattern',
  handler: [
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
  path: '/:institutionId/repositories/:pattern',
  handler: [
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

module.exports = router;
