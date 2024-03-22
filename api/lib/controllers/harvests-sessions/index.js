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
  getManyStatus,
  createOne,
  startOne,
  deleteOne,
  stopOne,
  getOneCredentials,
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
  path: '/status',
  handler: [
    getManyStatus,
  ],
  validate: {
    query: Joi.object({
      harvestIds: Joi.array().single().items(Joi.string()),
    }).rename('harvestIds[]', 'harvestIds'),
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
    type: 'json',
    params: {
      harvestId: Joi.string().trim().required(),
    },
    body: Joi.object({
      restartAll: Joi.boolean().default(false),
    }),
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
  path: '/:harvestId/credentials',
  handler: [
    getOneCredentials,
  ],
  validate: {
    params: {
      harvestId: Joi.string().trim().required(),
    },
    query: Joi.object({
      type: Joi.string().valid('harvestable', 'all'),
      include: Joi.array().single().items(Joi.string().valid('endpoint', 'institution')),
    }).rename('include[]', 'include'),
  },
});

module.exports = router;
