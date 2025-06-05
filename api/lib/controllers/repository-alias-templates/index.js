const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const {
  requireJwt,
  requireUser,
  requireAdmin,
} = require('../../services/auth');

const {
  standardQueryParams,

  getMany,
  getOne,
  importMany,
  upsertOne,
  deleteOne,
  updateOneProperty,
  applyOne,
} = require('./actions');

const {
  mutableFields,
  adminUpsertSchema,
} = require('../../entities/repository-alias-templates.dto');

router.use(requireJwt, requireUser, requireAdmin);

router.get('/', {
  method: 'GET',
  path: '/',
  handler: getMany,
  validate: {
    query: standardQueryParams.manyValidation.append({
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
  path: '/:id',
  handler: getOne,
  validate: {
    query: standardQueryParams.oneValidation,
    params: {
      id: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'PUT',
  path: '/:id',
  handler: upsertOne,
  validate: {
    type: 'json',
    body: adminUpsertSchema,
    params: {
      id: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'PUT',
  path: '/:id/:field',
  handler: updateOneProperty,
  validate: {
    type: 'json',
    body: {
      value: Joi.any(),
    },
    params: {
      id: Joi.string().trim().required(),
      field: Joi.string().trim().valid(...mutableFields).required(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/:id/_apply',
  handler: applyOne,
  validate: {
    params: {
      id: Joi.string().trim().required(),
    },
    query: {
      dryRun: Joi.boolean().default(false),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:id',
  handler: deleteOne,
  validate: {
    params: {
      id: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
