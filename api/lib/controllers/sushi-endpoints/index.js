const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  adminUpdateSchema,
  adminCreateSchema,
  adminImportSchema,
} = require('../../entities/sushi-endpoint.dto');

const stringOrArray = Joi.alternatives().try(
  Joi.string().trim().min(1),
  Joi.array().items(Joi.string().trim().min(1)).min(1),
);

const {
  requireJwt,
  requireUser,
  requireTermsOfUse,
  fetchSushiEndpoint,
  requireAdmin,
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
);

router.route({
  method: 'GET',
  path: '/',
  handler: [
    getAll,
  ],
  validate: {
    query: {
      requireCustomerId: Joi.boolean(),
      requireRequestorId: Joi.boolean(),
      requireApiKey: Joi.boolean(),
      isSushiCompliant: Joi.boolean(),
      tags: stringOrArray,
    },
  },
});

router.route({
  method: 'GET',
  path: '/:endpointId',
  handler: [
    fetchSushiEndpoint(),
    getOne,
  ],
  validate: {
    params: {
      endpointId: Joi.string().trim().required(),
    },
  },
});

router.use(requireAdmin);

router.route({
  method: 'POST',
  path: '/',
  handler: [
    addEndpoint,
  ],
  validate: {
    type: 'json',
    body: adminCreateSchema,
  },
});

router.route({
  method: 'POST',
  path: '/_import',
  handler: [
    importEndpoints,
  ],
  validate: {
    type: 'json',
    query: {
      overwrite: Joi.boolean().default(false),
    },
    body: adminImportSchema,
  },
});

router.route({
  method: 'PATCH',
  path: '/:endpointId',
  handler: [
    fetchSushiEndpoint(),
    updateEndpoint,
  ],
  validate: {
    type: 'json',
    params: {
      endpointId: Joi.string().trim().required(),
    },
    body: adminUpdateSchema,
  },
});

router.route({
  method: 'DELETE',
  path: '/:endpointId',
  handler: [
    fetchSushiEndpoint(),
    deleteOne,
  ],
  validate: {
    params: {
      endpointId: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
