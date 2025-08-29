const router = require('koa-joi-router')();

const { Joi } = require('koa-joi-router');

const {
  createSchema,
  updateSchema,
} = require('../../../entities/api-key.dto');

const {
  requireAuth,
  requireUser,
  requireTermsOfUse,
  forbidAPIKeys,
} = require('../../../services/auth');

const {
  standardQueryParams,

  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} = require('./actions');

// Global middlewares

router.use(requireAuth, requireUser, requireTermsOfUse);

// Routes

router.route({
  method: 'GET',
  path: '/',
  handler: [
    forbidAPIKeys,
    getAll,
  ],
  validate: {
    query: standardQueryParams.manyValidation,
  },
});

router.route({
  method: 'POST',
  path: '/',
  handler: [
    forbidAPIKeys,
    createOne,
  ],
  validate: {
    type: 'json',
    body: createSchema,
  },
});

router.route({
  method: 'GET',
  path: '/:apiKeyId',
  handler: [
    forbidAPIKeys,
    getOne,
  ],
  validate: {
    params: {
      apiKeyId: Joi.string().trim().required(),
    },
    query: standardQueryParams.oneValidation,
  },
});

router.route({
  method: 'PUT',
  path: '/:apiKeyId',
  handler: [
    forbidAPIKeys,
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
    forbidAPIKeys,
    deleteOne,
  ],
  validate: {
    params: {
      apiKeyId: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
