const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const SushiEndpoint = require('../../models/SushiEndpoint');

const {
  requireJwt,
  requireUser,
  requireAdmin,
  requireTermsOfUse,
  requireAnyRole,
  fetchInstitution,
  fetchSushiEndpoint,
  requireContact,
  requireValidatedInstitution,
} = require('../../services/auth');

const {
  getAll,
  getOne,
  deleteOne,
  updateEndpoint,
  addEndpoint,
  importEndpoints,
} = require('./actions');

router.use(
  requireJwt,
  requireUser,
  requireTermsOfUse,
  requireAnyRole(['sushi_form', 'admin', 'superuser']),
);

router.route({
  method: 'GET',
  path: '/',
  handler: [
    requireAdmin,
    getAll,
  ],
  validate: {
    query: {
      requireCustomerId: Joi.boolean(),
      requireRequestorId: Joi.boolean(),
      requireApiKey: Joi.boolean(),
      isSushiCompliant: Joi.boolean(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/',
  handler: [
    fetchInstitution({
      getId: (ctx) => ctx?.request?.body?.institutionId,
      ignoreNotFound: true,
    }),
    requireContact(),
    requireValidatedInstitution({ ignoreIfAdmin: true }),
    addEndpoint,
  ],
  validate: {
    type: 'json',
    body: SushiEndpoint.createSchema,
  },
});

router.route({
  method: 'POST',
  path: '/_import',
  handler: [
    fetchInstitution({
      query: 'institutionId',
      ignoreNotFound: true,
    }),
    requireContact(),
    importEndpoints,
  ],
  validate: {
    type: 'json',
    query: {
      institutionId: Joi.string().trim(),
      overwrite: Joi.boolean().default(false),
    },
    body: Joi.array().required().items({
      ...SushiEndpoint.updateSchema,
      id: SushiEndpoint.schema.id.optional(),
    }),
  },
});

/**
 * Fetch the SUSHI endpoint from the param endpointId
 * Fetch the associated institution
 * Check that the user is either admin or institution contact
 * Check that the institution is validated
 */
const commonHandlers = [
  fetchSushiEndpoint(),
  fetchInstitution({
    getId: (ctx) => ctx?.state?.endpoint?.get?.('institutionId'),
    ignoreNotFound: true,
  }),
  requireContact(),
  requireValidatedInstitution({ ignoreIfAdmin: true }),
];

router.route({
  method: 'GET',
  path: '/:endpointId',
  handler: [
    commonHandlers,
    getOne,
  ],
  validate: {
    params: {
      endpointId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'PATCH',
  path: '/:endpointId',
  handler: [
    commonHandlers,
    updateEndpoint,
  ],
  validate: {
    type: 'json',
    params: {
      endpointId: Joi.string().trim().required(),
    },
    body: Joi.object(SushiEndpoint.updateSchema)
      .fork(Object.keys(SushiEndpoint.updateSchema), (schema) => schema.optional()),
  },
});

router.route({
  method: 'DELETE',
  path: '/:endpointId',
  handler: [
    commonHandlers,
    deleteOne,
  ],
  validate: {
    params: {
      endpointId: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
