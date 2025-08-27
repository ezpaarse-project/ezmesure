const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { FEATURES } = require('../../entities/memberships.dto');

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
  updateInstitutionSushiReady,
} = require('./actions');

const memberships = require('./memberships');
const sushi = require('./sushi');
const repositories = require('./repositories');
const repositoryAliases = require('./repository-aliases');
const spaces = require('./spaces');
const elasticRoles = require('./elastic-roles');
const apiKeys = require('./api-keys');

const {
  getSubInstitutions,
  addSubInstitution,
  removeSubInstitution,
} = require('./subinstitutions');

const { validateInstitution } = require('./admin');

router.use(sushi.prefix('/:institutionId/sushi').middleware());
router.use(repositories.prefix('/:institutionId/repositories').middleware());
router.use(repositoryAliases.prefix('/:institutionId/repository-aliases').middleware());
router.use(spaces.prefix('/:institutionId/spaces').middleware());
router.use(elasticRoles.prefix('/:institutionId/elastic-roles').middleware());
router.use(apiKeys.prefix('/:institutionId/api-keys').middleware());
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
    fetchInstitution({
      include: {
        memberships: true,
        customProps: {
          include: { field: true },
        },
      },
    }),
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

router.route({
  method: 'PUT',
  path: '/:institutionId/sushiReadySince',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.sushi.write),
    updateInstitutionSushiReady,
  ],
  validate: {
    type: 'json',
    params: {
      institutionId: Joi.string().trim().required(),
    },
    body: {
      value: Joi.date().allow(null),
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
