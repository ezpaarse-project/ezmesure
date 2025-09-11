const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireJwt,
  requireUser,
  requireAdmin,
} = require('../../services/auth');

const { adminUpsertSchema } = require('../../entities/roles.dto');

const {
  standardQueryParams,

  getAll,
  getOne,
  upsertOne,
  deleteOne,
} = require('./actions');

const { stringOrArrayValidation } = require('../../services/std-query');

router.use(requireJwt, requireUser);

router.route({
  method: 'GET',
  path: '/',
  handler: getAll,
  validate: {
    query: standardQueryParams.manyValidation.append({
      endpointId: stringOrArrayValidation,
      institutionId: stringOrArrayValidation,
      tags: stringOrArrayValidation,
      packages: stringOrArrayValidation,
    }),
  },
});

router.route({
  method: 'GET',
  path: '/:roleId',
  handler: getOne,
  validate: {
    params: {
      roleId: Joi.string().trim().required(),
    },
    query: standardQueryParams.oneValidation,
  },
});

router.use(requireAdmin);

router.route({
  method: 'PUT',
  path: '/:roleId',
  handler: upsertOne,
  validate: {
    type: 'json',
    params: {
      roleId: Joi.string().trim().required(),
    },
    body: adminUpsertSchema,
  },
});

router.route({
  method: 'DELETE',
  path: '/:roleId',
  handler: deleteOne,
  validate: {
    params: {
      roleId: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
