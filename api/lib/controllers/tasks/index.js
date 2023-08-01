const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireJwt,
  requireUser,
  requireAdmin,
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

router.use(requireJwt, requireUser, requireAdmin);

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

router.route({
  method: 'GET',
  path: '/',
  handler: getAll,
  validate: {
    query: {
      size: Joi.number().min(1),
      id: stringOrArray,
      status: stringOrArray,
      type: stringOrArray,
      harvestId: stringOrArray,
      credentialsId: stringOrArray,
      endpointId: stringOrArray,
      institutionId: stringOrArray,
      distinct: stringOrArray,
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
