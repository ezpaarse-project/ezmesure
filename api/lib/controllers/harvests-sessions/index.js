const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  adminCreateSchema,
  adminUpdateSchema,
} = require('../../entities/harvest-session.dto');

const {
  requireJwt,
  requireUser,
  requireAdmin,
} = require('../../services/auth');

const {
  standardQueryParams,

  getAll,
  getOne,
  getManyStatus,
  createOne,
  getStartStatus,
  startOne,
  deleteOne,
  getStopStatus,
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
    query: standardQueryParams.manyValidation,
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
      harvestIds: Joi.array().single().items(Joi.string()).required(),
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
    query: standardQueryParams.oneValidation,
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
  method: 'GET',
  path: '/:harvestId/_start',
  handler: [
    getStartStatus,
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
      forceRefreshSupported: Joi.boolean().default(false),
      dryRun: Joi.boolean().default(false),
    }),
  },
});

router.route({
  method: 'GET',
  path: '/:harvestId/_stop',
  handler: [
    getStopStatus,
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
