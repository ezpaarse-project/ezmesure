const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const Institution = require('../../models/Institution');

const {
  createSchema,
  importSchema,
  updateSchema,
} = require('../../entities/sushi-credentials.dto');

const { stringifyException } = require('../../services/sushi');
const {
  requireJwt,
  requireUser,
  requireAdmin,
  requireTermsOfUse,
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
  getFileList,
  downloadFile,
  getTasks,
  getAvailableReports,
  deleteOne,
} = require('./actions');

const stringOrArray = Joi.alternatives().try(
  Joi.string().trim().min(1),
  Joi.array().items(Joi.string().trim().min(1)).min(1),
);

let sushiLocked = false;
let lockReason;

const blockIfLocked = (ctx, next) => {
  if (sushiLocked && ctx.method !== 'GET' && !ctx.state?.user?.isAdmin) {
    ctx.throw(403, ctx.$t('errors.sushi.managementLocked'), { detail: lockReason });
  }
  return next();
};

router.use(
  requireJwt,
  requireUser,
  requireTermsOfUse,
  blockIfLocked,
);

router.route({
  method: 'GET',
  path: '/_lock',
  handler: function getLock(ctx) {
    ctx.body = {
      locked: sushiLocked,
      reason: lockReason,
    };
  },
});

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
      id: stringOrArray,
      endpointId: stringOrArray,
      institutionId: stringOrArray,
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
    fetchSushiEndpoint({ getId: (ctx) => ctx?.request?.body?.endpointId }),
    addSushi,
  ],
  validate: {
    type: 'json',
    body: createSchema,
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
    body: importSchema,
  },
});

/**
 * Fetch the SUSHI item from the param sushiId
 * Fetch the associated institution
 * Check that the user is either admin or institution contact
 * Check that the institution is validated
 */
const commonHandlers = [
  fetchSushi({ include: { endpoint: true } }),
  fetchInstitution({ getId: (ctx) => ctx?.state?.sushi?.institutionId }),
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
    fetchSushiEndpoint({ getId: (ctx) => ctx?.state?.sushi?.endpointId }),
    async (ctx) => {
      const { sushi, institution } = ctx.state;

      ctx.action = 'sushi/check-connection';
      ctx.metadata = {
        sushiId: sushi.id,
        vendor: sushi.vendor,
        institutionId: institution.id,
        institutionName: institution.name,
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

      if (exceptions.length === 0 && error) {
        if (error?.expose && error?.message) {
          exceptions.push(error?.message);
        } else if (error?.response) {
          const status = error?.response?.status;
          const statusText = error?.response?.statusText;
          exceptions.push(ctx.$t('errors.sushi.badStatus', status, statusText));
        } else {
          exceptions.push(ctx.$t('errors.sushi.requestFailed'));
        }
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
      ctx.body = sushi.connection;
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
    fetchSushiEndpoint({ getId: (ctx) => ctx?.state?.sushi?.endpointId }),
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
    body: updateSchema,
  },
});

router.route({
  method: 'DELETE',
  path: '/:sushiId',
  handler: [
    commonHandlers,
    deleteOne,
  ],
  validate: {
    params: {
      sushiId: Joi.string().trim().required(),
    },
  },
});

router.use(requireAdmin);

router.route({
  method: 'GET',
  path: '/:sushiId/report.json',
  handler: [
    commonHandlers,
    fetchSushiEndpoint({ getId: (ctx) => ctx?.state?.sushi?.endpointId }),
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
    fetchSushiEndpoint({ getId: (ctx) => ctx?.state?.sushi?.endpointId }),
    harvestSushi,
  ],
  validate: {
    type: 'json',
    params: {
      sushiId: Joi.string().trim().required(),
    },
    body: {
      target: Joi.string().trim(),
      harvestId: Joi.string().trim(),
      beginDate: Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
      endDate: Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
      forceDownload: Joi.boolean().default(false),
      reportType: Joi.string().trim().lowercase().default('tr'),
      ignoreValidation: Joi.boolean(),
      timeout: Joi.number().integer().min(10).default(600),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:sushiId/files',
  handler: [
    commonHandlers,
    getFileList,
  ],
  validate: {
    params: {
      sushiId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:sushiId/files/:filePath(.*)',
  handler: [
    commonHandlers,
    downloadFile,
  ],
  validate: {
    params: {
      sushiId: Joi.string().trim().required(),
      filePath: Joi.string().trim().regex(/^[a-z0-9/_.-]+$/).required(),
    },
  },
});

module.exports = router;
