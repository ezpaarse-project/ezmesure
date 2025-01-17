const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  createSchema,
  importSchema,
  updateSchema,
} = require('../../entities/sushi-credentials.dto');

const {
  requireJwt,
  requireUser,
  requireAdmin,
  requireTermsOfUse,
  fetchInstitution,
  fetchSushi,
  fetchSushiEndpoint,
  requireValidatedInstitution,
  requireMemberPermissions,
} = require('../../services/auth');

const {
  standardQueryParams,

  getAll,
  getOne,
  updateSushi,
  addSushi,
  importSushiItems,
  downloadReport,
  getFileList,
  downloadFile,
  getTasks,
  getAvailableReports,
  deleteOne,
  getHarvests,
  checkCredentialsConnection,
  checkSushiConnection,
  validateReport,
  deleteSushiConnection,
} = require('./actions');

const { FEATURES } = require('../../entities/memberships.dto');

const connectionValidation = Joi.string().valid('working', 'unauthorized', 'faulty', 'untested');

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
    query: standardQueryParams.manyValidation.append({
      connection: Joi.alternatives().try(
        connectionValidation.min(0),
        Joi.array().items(connectionValidation.min(1)).min(1),
      ),
      q: Joi.string().trim().allow(''),
    }).rename('connection[]', 'connection'),
  },
});

router.route({
  method: 'POST',
  path: '/',
  handler: [
    fetchInstitution({ getId: (ctx) => ctx?.request?.body?.institutionId }),
    requireMemberPermissions(FEATURES.sushi.write),
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
    requireMemberPermissions(FEATURES.sushi.write),
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

router.route({
  method: 'POST',
  path: '/_check_connection',
  handler: [
    fetchInstitution({ getId: (ctx) => ctx?.request?.body?.institution?.id, ignoreNotFound: true }),
    requireMemberPermissions(FEATURES.sushi.write),
    requireValidatedInstitution({ ignoreIfAdmin: true }),
    checkCredentialsConnection,
  ],
  validate: {
    type: 'json',
    query: {
      beginDate: Joi.string().regex(/^\d{4}-\d{2}$/).optional(),
      endDate: Joi.string().regex(/^\d{4}-\d{2}$/).optional(),
    },
    body: Joi.object({
      id: Joi.string().trim().min(1).empty(null),
      endpoint: Joi.object({
        id: Joi.string().trim().empty(null),
        sushiUrl: Joi.string().trim().required(),
        harvestDateFormat: Joi.string().allow('').trim().empty(null),
        testedReport: Joi.string().allow('').trim().empty(null),
        paramSeparator: Joi.string().allow('').trim().empty(null),
        params: Joi.array(),
      }).unknown().required(),
      institution: Joi.object({
        id: Joi.string().trim().required(),
      }).unknown(),
      customerId: Joi.string().allow('').trim().empty(null),
      requestorId: Joi.string().allow('').trim().empty(null),
      apiKey: Joi.string().allow('').trim().empty(null),
      params: Joi.array(),
    }).or('customerId', 'requestorId', 'apiKey').unknown(),
  },
});

router.route({
  method: 'POST',
  path: '/_validate_report',
  handler: [
    validateReport,
  ],
  validate: {
    type: 'json',
    body: Joi.any().required(),
  },
});

/**
 * Fetch the SUSHI item from the param sushiId
 * Fetch the associated institution
 * Check that the user is either admin or institution contact
 * Check that the institution is validated
 */
const commonHandlers = (requiredPermission) => [
  fetchSushi({ include: { endpoint: true, institution: true } }),
  fetchInstitution({ getId: (ctx) => ctx?.state?.sushi?.institutionId }),
  requireMemberPermissions(requiredPermission),
  requireValidatedInstitution({ ignoreIfAdmin: true }),
];

router.route({
  method: 'GET',
  path: '/:sushiId',
  handler: [
    commonHandlers(FEATURES.sushi.read),
    getOne,
  ],
  validate: {
    params: {
      sushiId: Joi.string().trim().required(),
    },
    query: standardQueryParams.oneValidation,
  },
});

router.route({
  method: 'GET',
  path: '/:sushiId/tasks',
  handler: [
    commonHandlers(FEATURES.sushi.read),
    getTasks,
  ],
  validate: {
    params: {
      sushiId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/:sushiId/_check_connection',
  handler: [
    commonHandlers(FEATURES.sushi.write),
    checkSushiConnection,
  ],
  validate: {
    params: {
      sushiId: Joi.string().trim().required(),
    },
    query: {
      beginDate: Joi.string().regex(/^\d{4}-\d{2}$/).optional(),
      endDate: Joi.string().regex(/^\d{4}-\d{2}$/).optional(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:sushiId/connection',
  handler: [
    requireAdmin,
    commonHandlers(FEATURES.sushi.write),
    deleteSushiConnection,
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
    commonHandlers(FEATURES.sushi.read),
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
  method: 'GET',
  path: '/:sushiId/harvests',
  handler: [
    commonHandlers(FEATURES.sushi.read),
    getHarvests,
  ],
  validate: {
    params: {
      sushiId: Joi.string().trim().required(),
    },
    query: {
      from: Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
      to: Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
      reportId: Joi.string().trim(),
      size: Joi.number().min(0),
      page: Joi.number().min(1),
      sort: Joi.string(),
      order: Joi.string().valid('asc', 'desc'),
    },
  },
});

router.route({
  method: 'PATCH',
  path: '/:sushiId',
  handler: [
    commonHandlers(FEATURES.sushi.write),
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
    commonHandlers(FEATURES.sushi.write),
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
    commonHandlers(FEATURES.sushi.delete),
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
  method: 'GET',
  path: '/:sushiId/files',
  handler: [
    fetchSushi({ include: { endpoint: true } }),
    fetchInstitution({ getId: (ctx) => ctx?.state?.sushi?.institutionId }),
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
    fetchSushi({ include: { endpoint: true } }),
    fetchInstitution({ getId: (ctx) => ctx?.state?.sushi?.institutionId }),
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
