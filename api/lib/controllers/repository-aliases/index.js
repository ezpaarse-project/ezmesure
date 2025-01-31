const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const {
  requireJwt,
  requireUser,
  requireAdmin,
  fetchRepositoryAlias,
} = require('../../services/auth');

const {
  standardQueryParams,

  getMany,
  getOne,
  createOne,
  importMany,
  updateOne,
  deleteOne,
} = require('./actions');

const {
  adminCreateSchema,
  adminUpdateSchema,
} = require('../../entities/repository-aliases.dto');

router.use(requireJwt, requireUser, requireAdmin);

router.get('/', {
  method: 'GET',
  path: '/',
  handler: getMany,
  validate: {
    query: standardQueryParams.manyValidation.append({
      institutionId: Joi.string().trim(),
      repository: Joi.string().trim(),
      type: Joi.string().trim(),
    }),
  },
});

router.route({
  method: 'POST',
  path: '/_import',
  handler: importMany,
  validate: {
    type: 'json',
    query: {
      overwrite: Joi.boolean().default(false),
    },
    body: Joi.array(),
  },
});

router.route({
  method: 'GET',
  path: '/:pattern',
  handler: getOne,
  validate: {
    query: standardQueryParams.oneValidation,
    params: {
      pattern: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/',
  handler: createOne,
  validate: {
    type: 'json',
    body: adminCreateSchema,
  },
});

router.route({
  method: 'PATCH',
  path: '/:pattern',
  handler: [
    fetchRepositoryAlias(),
    updateOne,
  ],
  validate: {
    type: 'json',
    body: adminUpdateSchema,
    params: {
      pattern: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:pattern',
  handler: [
    fetchRepositoryAlias(),
    deleteOne,
  ],
  validate: {
    params: {
      pattern: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
