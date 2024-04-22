const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  createSchema,
  importSchema,
  updateSchema,
  includableFields,
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
  checkSushiConnection,
  deleteSushiConnection,
} = require('./actions');

const { FEATURES } = require('../../entities/memberships.dto');

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
    query: Joi.object({
      id: stringOrArray,
      endpointId: stringOrArray,
      institutionId: stringOrArray,
      connection: Joi.string().valid('working', 'faulty', 'untested'),
      q: Joi.string().min(0),
      size: Joi.number().min(0),
      page: Joi.number().min(1),
      sort: Joi.string(),
      order: Joi.string().valid('asc', 'desc'),
      include: Joi.array().single().items(Joi.string().valid(...includableFields)),
    })
      .rename('include[]', 'include')
      .rename('id[]', 'id')
      .rename('endpointId[]', 'endpointId')
      .rename('institutionId[]', 'institutionId'),
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
