const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const sushiPlatforms = require('../../utils/sushi.json');
const Sushi = require('../../models/Sushi');
const {
  requireJwt,
  requireUser,
  requireTermsOfUse,
  requireAnyRole,
  fetchInstitution,
  requireContact,
} = require('../../services/auth');

const {
  getAll,
  getOne,
  deleteSushiData,
  updateSushi,
  addSushi,
  importSushi,
  importSushiItems,
  downloadReport,
  getTasks,
  getAvailableReports,
} = require('./actions');

router.use(
  requireJwt,
  requireUser,
  requireTermsOfUse,
  requireAnyRole(['sushi_form', 'admin', 'superuser']),
);

router.route({
  method: 'GET',
  path: '/',
  handler: getAll,
});

router.route({
  method: 'GET',
  path: '/platforms.json',
  handler: (ctx) => {
    ctx.type = 'json';
    ctx.status = 200;
    ctx.body = sushiPlatforms;
  },
});

router.route({
  method: 'POST',
  path: '/batch_delete',
  handler: deleteSushiData,
  validate: {
    type: 'json',
    body: {
      ids: Joi.array().items(Joi.string().trim()),
    },
  },
});

router.route({
  method: 'POST',
  path: '/',
  handler: addSushi,
  validate: {
    type: 'json',
    body: Sushi.createSchema,
  },
});

router.route({
  method: 'POST',
  path: '/_import',
  handler: [
    fetchInstitution({ query: 'institutionId' }),
    requireContact(),
    importSushiItems,
  ],
  validate: {
    type: 'json',
    query: {
      institutionId: Joi.string().trim().required(),
      overwrite: Joi.boolean().default(false),
    },
    body: Joi.array().required().items({
      ...Sushi.updateSchema,
      id: Sushi.schema.id,
    }),
  },
});

router.route({
  method: 'GET',
  path: '/:sushiId',
  handler: getOne,
  validate: {
    params: {
      sushiId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:sushiId/tasks',
  handler: getTasks,
  validate: {
    params: {
      sushiId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:sushiId/reports',
  handler: getAvailableReports,
  validate: {
    params: {
      sushiId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'PATCH',
  path: '/:sushiId',
  handler: updateSushi,
  validate: {
    type: 'json',
    params: {
      sushiId: Joi.string().trim().required(),
    },
    body: Sushi.updateSchema,
  },
});

requireAnyRole(['admin', 'superuser']);

router.route({
  method: 'GET',
  path: '/:sushiId/report.json',
  handler: downloadReport,
  validate: {
    params: {
      sushiId: Joi.string().trim().required(),
    },
    query: {
      beginDate: Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
      endDate: Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
    },
  },
});

router.route({
  method: 'POST',
  path: '/:sushiId/_import',
  handler: importSushi,
  validate: {
    type: 'json',
    params: {
      sushiId: Joi.string().trim().required(),
    },
    body: {
      target: Joi.string().trim().required(),
      beginDate: Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
      endDate: Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
    },
  },
});

module.exports = router;
