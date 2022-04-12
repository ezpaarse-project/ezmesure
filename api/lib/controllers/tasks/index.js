const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireJwt,
  requireUser,
  requireTermsOfUse,
  requireAnyRole,
} = require('../../services/auth');

const {
  getAll,
  getOne,
  deleteOne,
  cancelOne,
} = require('./actions');

const stringOrArray = Joi.alternatives().try(
  Joi.string().trim().min(1),
  Joi.array().items(Joi.string().trim().min(1)).min(1),
);

router.use(requireJwt, requireUser, requireTermsOfUse, requireAnyRole(['sushi_form', 'admin', 'superuser']));

router.route({
  method: 'GET',
  path: '/:taskId',
  handler: getOne,
  validate: {
    params: {
      taskId: Joi.string().trim().required(),
    },
  },
});

router.use(requireAnyRole(['admin', 'superuser']));

router.route({
  method: 'GET',
  path: '/',
  handler: getAll,
  validate: {
    query: {
      id: stringOrArray,
      status: stringOrArray,
      type: stringOrArray,
      harvestId: stringOrArray,
      sushiId: stringOrArray,
      endpointId: stringOrArray,
      institutionId: stringOrArray,
      collapse: Joi.string().trim(),
    },
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
