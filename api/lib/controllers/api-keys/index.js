const router = require('koa-joi-router')();

const { Joi } = require('koa-joi-router');

const {
  schema,

  createSchema,
  updateSchema,
} = require('../../entities/api-key.dto');

const {
  requireAuth,
  requireUser,
  requireAdmin,
  forbidAPIKeys,
} = require('../../services/auth');

const {
  standardQueryParams,

  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
  importMany,
} = require('./actions');

// Global middlewares

router.use(requireAuth, requireUser, requireAdmin, forbidAPIKeys);

// Routes

router.route({
  method: 'GET',
  path: '/',
  handler: [
    getAll,
  ],
  validate: {
    query: standardQueryParams.manyValidation.append({
      source: Joi.string().valid('*'),
    }),
  },
});

router.route({
  method: 'POST',
  path: '/',
  handler: [
    createOne,
  ],
  validate: {
    type: 'json',
    body: createSchema.append({
      institutionId: schema.institutionId,
      username: schema.username,
    }),
  },
});

router.route({
  method: 'GET',
  path: '/:apiKeyId',
  handler: [
    getOne,
  ],
  validate: {
    params: {
      apiKeyId: Joi.string().trim().required(),
    },
    query: standardQueryParams.oneValidation.append({
      source: Joi.string().allow('*'),
    }),
  },
});

router.route({
  method: 'PUT',
  path: '/:apiKeyId',
  handler: [
    updateOne,
  ],
  validate: {
    params: {
      apiKeyId: Joi.string().trim().required(),
    },
    type: 'json',
    body: updateSchema,
  },
});

router.route({
  method: 'DELETE',
  path: '/:apiKeyId',
  handler: [
    deleteOne,
  ],
  validate: {
    params: {
      apiKeyId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/_import',
  handler: [
    importMany,
  ],
  validate: {
    type: 'json',
    query: {
      overwrite: Joi.boolean().default(false),
    },
    body: Joi.array(),
  },
});

module.exports = router;
