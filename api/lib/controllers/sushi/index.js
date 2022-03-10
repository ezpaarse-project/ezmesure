const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const Sushi = require('../../models/Sushi');
const Institution = require('../../models/Institution');
const { stringifyException } = require('../../services/sushi');
const {
  requireJwt,
  requireUser,
  requireAdmin,
  requireTermsOfUse,
  requireAnyRole,
  fetchInstitution,
  fetchSushi,
  fetchSushiEndpoint,
  requireContact,
  requireValidatedInstitution,
} = require('../../services/auth');

const {
  getAll,
  getOne,
  deleteSushiData,
  updateSushi,
  addSushi,
  harvestSushi,
  importSushiItems,
  downloadReport,
  getTasks,
  getAvailableReports,
} = require('./actions');

let sushiLocked = false;
let lockReason;

const blockIfLocked = (ctx, next) => {
  if (sushiLocked && ctx.method !== 'GET' && !ctx.state?.userIsAdmin) {
    ctx.throw(403, ctx.$t('errors.sushi.managementLocked'), { detail: lockReason });
  }
  return next();
};

router.use(
  requireJwt,
  requireUser,
  requireTermsOfUse,
  requireAnyRole(['sushi_form', 'admin', 'superuser']),
  blockIfLocked,
);

router.route({
  method: 'PUT',
  path: '/_lock',
  handler: [
    requireAdmin,
    function setLock(ctx) {
      sushiLocked = !!ctx.request?.body?.locked;
      lockReason = sushiLocked ? ctx?.request?.body?.reason : undefined;

      ctx.body = {
        locked: sushiLocked,
      };
    },
  ],
  validate: {
    type: 'json',
    body: {
      locked: Joi.boolean().required(),
      reason: Joi.string().trim().empty(''),
    },
  },
});

router.route({
  method: 'GET',
  path: '/',
  handler: [
    requireAdmin,
    getAll,
  ],
  validate: {
    query: {
      connection: Joi.string().valid('working', 'faulty', 'untested'),
    },
  },
});

router.route({
  method: 'POST',
  path: '/batch_delete',
  handler: [
    async (ctx, next) => {
      const { user } = ctx.state;
      ctx.state.institution = await Institution.findOneByCreatorOrRole(user.username, user.roles);
      return next();
    },
    requireContact(),
    requireValidatedInstitution({ ignoreIfAdmin: true }),
    deleteSushiData,
  ],
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
  handler: [
    fetchInstitution({ getId: (ctx) => ctx?.request?.body?.institutionId }),
    requireContact(),
    requireValidatedInstitution({ ignoreIfAdmin: true }),
    addSushi,
  ],
  validate: {
    type: 'json',
    body: Sushi.getSchema('create'),
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
      ...Sushi.getSchema('update'),
      id: Sushi.getSchema('base')?.id,
    }),
  },
});

/**
 * Fetch the SUSHI item from the param sushiId
 * Fetch the associated institution
 * Check that the user is either admin or institution contact
 * Check that the institution is validated
 */
const commonHandlers = [
  fetchSushi(),
  fetchInstitution({ getId: (ctx) => ctx?.state?.sushi?.get?.('institutionId') }),
  requireContact(),
  requireValidatedInstitution({ ignoreIfAdmin: true }),
];

router.route({
  method: 'GET',
  path: '/:sushiId',
  handler: [
    commonHandlers,
    getOne,
  ],
  validate: {
    params: {
      sushiId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:sushiId/tasks',
  handler: [
    commonHandlers,
    getTasks,
  ],
  validate: {
    params: {
      sushiId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:sushiId/connection',
  handler: [
    commonHandlers,
    fetchSushiEndpoint({ getId: (ctx) => ctx?.state?.sushi?.get?.('endpointId') }),
    async (ctx) => {
      const { sushi, institution } = ctx.state;

      ctx.action = 'sushi/check-connection';
      ctx.metadata = {
        sushiId: sushi.getId(),
        vendor: sushi.get('vendor'),
        institutionId: institution.getId(),
        institutionName: institution.get('name'),
      };

      let error;
      try {
        await getAvailableReports(ctx);
      } catch (e) {
        error = e;
      }

      const exceptions = Array.isArray(ctx?.body?.exceptions)
        ? ctx.body.exceptions.map(stringifyException)
        : [];

      if (exceptions.length === 0 && error?.isAxiosError) {
        const status = error?.response?.status;
        const statusText = error?.response?.statusText;
        exceptions.push(`Endpoint responded with ${status} ${statusText}`);
      }

      sushi.set('connection', {
        success: !error && ctx.status === 200,
        date: new Date(),
        exceptions,
      });

      try {
        await sushi.save();
      } catch (e) {
        throw new Error(e);
      }

      ctx.status = 200;
      ctx.body = sushi.get('connection');
    },
  ],
  validate: {
    params: {
      sushiId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:sushiId/reports',
  handler: [
    commonHandlers,
    fetchSushiEndpoint({ getId: (ctx) => ctx?.state?.sushi?.get?.('endpointId') }),
    getAvailableReports,
  ],
  validate: {
    params: {
      sushiId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'PATCH',
  path: '/:sushiId',
  handler: [
    commonHandlers,
    updateSushi,
  ],
  validate: {
    type: 'json',
    params: {
      sushiId: Joi.string().trim().required(),
    },
    body: Sushi.getSchema('update'),
  },
});

requireAnyRole(['admin', 'superuser']);

router.route({
  method: 'GET',
  path: '/:sushiId/report.json',
  handler: [
    commonHandlers,
    fetchSushiEndpoint({ getId: (ctx) => ctx?.state?.sushi?.get?.('endpointId') }),
    downloadReport,
  ],
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
  path: '/:sushiId/_harvest',
  handler: [
    commonHandlers,
    fetchSushiEndpoint({ getId: (ctx) => ctx?.state?.sushi?.get?.('endpointId') }),
    harvestSushi,
  ],
  validate: {
    type: 'json',
    params: {
      sushiId: Joi.string().trim().required(),
    },
    body: {
      target: Joi.string().trim(),
      beginDate: Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
      endDate: Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
      forceDownload: Joi.boolean().default(false),
      reportType: Joi.string().trim().lowercase().default('tr'),
    },
  },
});

module.exports = router;
