const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireJwt,
  requireUser,
  requireAdmin,
} = require('../../services/auth');

const {
  getAll,
  getAllMeta,
  getOne,
  deleteOne,
  cancelOne,
} = require('./actions');

const {
  includableFields,
} = require('../../entities/harvest-job.dto');

const stringOrArray = Joi.alternatives().try(
  Joi.string().trim().min(1),
  Joi.array().items(Joi.string().trim().min(1)).min(1),
);

router.use(requireJwt, requireUser, requireAdmin);

router.route({
  method: 'GET',
  path: '/',
  handler: getAll,
  validate: {
    query: Joi.object({
      size: Joi.number().min(-1),
      page: Joi.number().min(1),
      sort: Joi.string(),
      order: Joi.string().valid('asc', 'desc'),
      id: stringOrArray,
      status: stringOrArray,
      type: stringOrArray,
      sessionId: stringOrArray,
      credentialsId: stringOrArray,
      endpointId: stringOrArray,
      institutionId: stringOrArray,
      tags: stringOrArray,
      distinct: stringOrArray,
      include: Joi.array().single().items(Joi.string().valid(...includableFields)),
    }).rename('include[]', 'include'),
  },
});

router.route({
  method: 'GET',
  path: '/_meta',
  handler: getAllMeta,
  validate: {
    query: {
      status: stringOrArray,
      type: stringOrArray,
      sessionId: stringOrArray,
      credentialsId: stringOrArray,
      endpointId: stringOrArray,
      institutionId: stringOrArray,
      tags: stringOrArray,
    },
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
