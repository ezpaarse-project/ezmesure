const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { FEATURES } = require('../../entities/memberships.dto');

const {
  includableFields: spaceIncludableFields,
} = require('../../entities/repositories.dto');

const {
  requireJwt,
  requireUser,
  fetchInstitution,
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
  updateInstitution,
  getSushiData,
  getInstitutionSpaces,
} = require('./actions');

const memberships = require('./memberships');
const repositories = require('./repositories');

const {
  getSubInstitutions,
  addSubInstitution,
  removeSubInstitution,
} = require('./subinstitutions');

const {
  getInstitutionState,
  validateInstitution,
} = require('./admin');

router.use(repositories.prefix('/:institutionId/repositories').middleware());
router.use(memberships.prefix('/:institutionId/').middleware()); // Weird prefix cause of contact route

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

module.exports = router;
