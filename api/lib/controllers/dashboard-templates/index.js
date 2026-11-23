const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireActiveJwt,
  requireUser,
  requireAdmin,
} = require('../../services/auth');

const { adminUpsertSchema, adminCreateSchema } = require('../../entities/dashboard.dto');

const {
  standardQueryParams,

  getAll,
  getOne,
  createOne,
  upsertOne,
  deleteOne,
  importMany,
  refreshOne,
} = require('./actions');

router.use(requireActiveJwt, requireUser);

router.route({
  method: 'GET',
  path: '/',
  handler: getAll,
  validate: {
    query: standardQueryParams.manyValidation,
  },
});

router.route({
  method: 'GET',
  path: '/:id',
  handler: getOne,
  validate: {
    params: {
      id: Joi.string().trim().required(),
    },
    query: standardQueryParams.oneValidation,
  },
});

router.use(requireAdmin);

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
  path: '/:id',
  handler: upsertOne,
  validate: {
    type: 'json',
    params: {
      id: Joi.string().trim().required(),
    },
    body: adminUpsertSchema,
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

router.route({
  method: 'POST',
  path: '/:id/_refresh',
  handler: refreshOne,
  validate: {
    params: {
      id: Joi.string().trim().required(),
    },
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

module.exports = router;
