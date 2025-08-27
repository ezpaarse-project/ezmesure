const router = require('koa-joi-router')();

const { Joi } = require('koa-joi-router');

const { FEATURES } = require('../../../entities/memberships.dto');

const {
  createSchema,
  updateSchema,
} = require('../../../entities/api-key.dto');

const {
  requireAuth,
  requireUser,
  requireTermsOfUse,
  fetchInstitution,
  requireMemberPermissions,
} = require('../../../services/auth');

const {
  standardQueryParams,

  getAll,
  getOne,
  createOne,
  updateOne,
  deleteOne,
} = require('./actions');

router.use(requireAuth, requireUser, requireTermsOfUse);

router.route({
  method: 'GET',
  path: '/',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.apiKeys.read),
    getAll,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
    query: standardQueryParams.manyValidation,
  },
});

router.route({
  method: 'POST',
  path: '/',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.apiKeys.write),
    createOne,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
    type: 'json',
    body: createSchema,
  },
});

router.route({
  method: 'GET',
  path: '/:apiKeyId',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.apiKeys.read),
    getOne,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
      apiKeyId: Joi.string().trim().required(),
    },
    query: standardQueryParams.oneValidation,
  },
});

router.route({
  method: 'PUT',
  path: '/:apiKeyId',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.apiKeys.write),
    updateOne,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
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
    fetchInstitution(),
    requireMemberPermissions(FEATURES.apiKeys.write),
    deleteOne,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
      apiKeyId: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
