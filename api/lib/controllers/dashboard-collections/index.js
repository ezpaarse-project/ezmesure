const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireActiveJwt,
  requireUser,
  requireAdmin,
} = require('../../services/auth');

const { adminUpsertSchema } = require('../../entities/dashboard-collection.dto');

const {
  standardQueryParams,

  getAll,
  getOne,
  upsertOne,
  deleteOne,
  importMany,
  addToSpace,
  removeFromSpace,
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
  method: 'PUT',
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
  method: 'PUT',
  path: '/:id/spaces/:spaceId',
  handler: addToSpace,
  validate: {
    type: 'json',
    params: {
      id: Joi.string().trim().required(),
      spaceId: Joi.string().trim().required(),
    },
    body: {
      repositoryPattern: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:id/spaces/:spaceId',
  handler: removeFromSpace,
  validate: {
    type: 'json',
    params: {
      id: Joi.string().trim().required(),
      spaceId: Joi.string().trim().required(),
    },
    body: {
      repositoryPattern: Joi.string().trim().required(),
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
