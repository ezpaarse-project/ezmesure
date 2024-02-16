const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  includableFields,
  adminCreateSchema,
  adminUpdateSchema,
} = require('../../entities/harvest-session.dto');

const {
  requireJwt,
  requireUser,
  requireAdmin,
} = require('../../services/auth');

const {
  getAll,
  getOne,
  createOne,
  startOne,
  deleteOne,
  stopOne,
  getOneStatus,
  getOneInstitutions,
  upsertOne,
} = require('./actions');

router.use(
  requireJwt,
  requireUser,
  requireAdmin,
);

router.route({
  method: 'GET',
  path: '/',
  handler: [
    getAll,
  ],
  validate: {
    query: Joi.object({
      size: Joi.number().min(-1),
      page: Joi.number().min(1),
      sort: Joi.string(),
      order: Joi.string().valid('asc', 'desc'),
      include: Joi.array().single().items(Joi.string().valid(...includableFields)),
    }).rename('include[]', 'include'),
  },
});

router.route({
  method: 'POST',
  path: '/',
  handler: [
    createOne,
  ],
  validate: {
    type: 'json',
    body: adminCreateSchema,
  },
});

router.route({
  method: 'GET',
  path: '/:harvestId',
  handler: [
    getOne,
  ],
  validate: {
    params: {
      harvestId: Joi.string().trim().required(),
    },
    query: Joi.object({
      include: Joi.array().single().items(Joi.string().valid(...includableFields)),
    }).rename('include[]', 'include'),
  },
});

router.route({
  method: 'PUT',
  path: '/:harvestId',
  handler: [
    upsertOne,
  ],
  validate: {
    type: 'json',
    params: {
      harvestId: Joi.string().trim().required(),
    },
    body: adminUpdateSchema,
  },
});

router.route({
  method: 'DELETE',
  path: '/:harvestId',
  handler: [
    deleteOne,
  ],
  validate: {
    params: {
      harvestId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/:harvestId/_start',
  handler: [
    startOne,
  ],
  validate: {
    params: {
      harvestId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/:harvestId/_stop',
  handler: [
    stopOne,
  ],
  validate: {
    params: {
      harvestId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:harvestId/status',
  handler: [
    getOneStatus,
  ],
  validate: {
    params: {
      harvestId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:harvestId/institutions',
  handler: [
    getOneInstitutions,
  ],
  validate: {
    params: {
      harvestId: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
