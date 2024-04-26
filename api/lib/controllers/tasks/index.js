const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireJwt,
  requireUser,
  requireAdmin,
} = require('../../services/auth');

const {
  standardQueryParams,

  getAll,
  getAllMeta,
  getOne,
  deleteOne,
  cancelOne,
} = require('./actions');

const { stringOrArrayValidation } = require('../../services/std-query');

router.use(requireJwt, requireUser, requireAdmin);

router.route({
  method: 'GET',
  path: '/',
  handler: getAll,
  validate: {
    query: standardQueryParams.manyValidation.append({
      credentialsId: stringOrArrayValidation,
      endpointId: stringOrArrayValidation,
      institutionId: stringOrArrayValidation,
    }),
  },
});

router.route({
  method: 'GET',
  path: '/_meta',
  handler: getAllMeta,
  validate: {
    query: standardQueryParams.manyValidation.append({
      credentialsId: stringOrArrayValidation,
      endpointId: stringOrArrayValidation,
      institutionId: stringOrArrayValidation,
      include: Joi.forbidden(),
    }),
  },
});

router.route({
  method: 'GET',
  path: '/:taskId',
  handler: getOne,
  validate: {
    params: {
      taskId: Joi.string().trim().required(),
    },
    query: standardQueryParams.oneValidation,
  },
});

router.route({
  method: 'POST',
  path: '/:taskId/_cancel',
  handler: cancelOne,
  validate: {
    params: {
      taskId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:taskId',
  handler: deleteOne,
  validate: {
    params: {
      taskId: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
