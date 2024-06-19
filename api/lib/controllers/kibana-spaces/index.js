const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const {
  requireJwt,
  requireUser,
  fetchSpace,
  requireAdmin,
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
} = require('../../entities/spaces.dto');

const permissions = require('./permissions');

router.use(permissions.prefix('/:spaceId/permissions').middleware());

router.use(requireJwt, requireUser, requireAdmin);

router.get('/', {
  method: 'GET',
  path: '/',
  handler: getMany,
  validate: {
    query: standardQueryParams.manyValidation,
  },
});

router.route({
  method: 'GET',
  path: '/:spaceId',
  handler: [
    getOne,
  ],
  validate: {
    params: {
      spaceId: Joi.string().trim().required(),
    },
    query: standardQueryParams.oneValidation,
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
  method: 'PATCH',
  path: '/:spaceId',
  handler: [
    fetchSpace(),
    updateOne,
  ],
  validate: {
    type: 'json',
    body: adminUpdateSchema,
    params: {
      spaceId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:spaceId',
  handler: [
    fetchSpace(),
    deleteOne,
  ],
  validate: {
    params: {
      spaceId: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
