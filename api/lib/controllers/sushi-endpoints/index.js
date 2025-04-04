const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  adminUpdateSchema,
  adminCreateSchema,
} = require('../../entities/sushi-endpoints.dto');

const {
  requireJwt,
  requireUser,
  requireTermsOfUse,
  fetchSushiEndpoint,
  requireAdmin,
} = require('../../services/auth');

const {
  standardQueryParams,
  getAll,
  getOne,
  deleteOne,
  updateEndpoint,
  addEndpoint,
  importEndpoints,
} = require('./actions');

const registry = require('./_registry');

router.use(registry.prefix('/_registry').middleware());

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
    query: standardQueryParams.manyValidation,
  },
});

router.route({
  method: 'GET',
  path: '/:endpointId',
  handler: [
    getOne,
  ],
  validate: {
    params: {
      endpointId: Joi.string().trim().required(),
    },
    query: standardQueryParams.oneValidation,
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
    body: Joi.array(),
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
