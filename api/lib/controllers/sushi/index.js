const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const sushiPlatforms = require('../../utils/sushi.json');
const Sushi = require('../../models/Sushi');
const { appLogger } = require('../../../server');
const {
  requireJwt,
  requireUser,
  requireTermsOfUse,
  requireAnyRole,
} = require('../../services/auth');

function saveSushiConnectionState(ctx, next) {
  return next().finally(() => {
    const { sushiId } = ctx.params;
    const success = ctx.status >= 200 && ctx.status < 400;

    if (!success && ctx.status !== 502) { return; }

    Sushi.setConnectionStateById(sushiId, { date: new Date(), success })
      .then(() => {
        appLogger.info(`Sushi ${sushiId}: connection state changed to ${success ? 'success' : 'failure'}`);
      })
      .catch((e) => {
        appLogger.error('Failed to save sushi connection status');
        appLogger.error(e);
      });
  });
}

const {
  getAll,
  getOne,
  deleteSushiData,
  updateSushi,
  addSushi,
  importSushi,
  downloadReport,
  getTasks,
  getAvailableReports,
} = require('./actions');

router.use(requireJwt, requireUser, requireTermsOfUse, requireAnyRole(['sushi_form_tester', 'admin', 'superuser']));

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
  handler: [saveSushiConnectionState, getAvailableReports],
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
    type: 'json',
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
