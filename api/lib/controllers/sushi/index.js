const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const sushiPlatforms = require('../../utils/sushi.json');
const Sushi = require('../../models/Sushi');
const Institution = require('../../models/Institution');
const { appLogger } = require('../../services/logger');
const { stringifyException } = require('../../services/sushi');
const {
  requireJwt,
  requireUser,
  requireAdmin,
  requireTermsOfUse,
  requireAnyRole,
  fetchInstitution,
  fetchSushi,
  requireContact,
  requireValidatedInstitution,
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
  handler: [
    requireAdmin,
    getAll,
  ],
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
  handler: [
    async (ctx, next) => {
      const { user } = ctx.state;
      ctx.state.institution = await Institution.findOneByCreatorOrRole(user.username, user.roles);
      return next();
    },
    requireContact(),
    requireValidatedInstitution(),
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
    fetchInstitution((ctx) => ctx?.request?.body?.institutionId),
    requireContact(),
    requireValidatedInstitution(),
    addSushi,
  ],
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

/**
 * Fetch the SUSHI item from the param sushiId
 * Fetch the associated institution
 * Check that the user is either admin or institution contact
 * Check that the institution is validated
 */
const commonHandlers = [
  fetchSushi(),
  fetchInstitution((ctx) => ctx?.state?.sushi?.get?.('institutionId')),
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
    async (ctx) => {
      let error;
      try {
        await getAvailableReports(ctx);
      } catch (e) {
        error = e;
      }

      const { sushi } = ctx.state;

      const exceptions = Array.isArray(ctx.exceptions)
        ? ctx.exceptions.map(stringifyException)
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
    body: Sushi.updateSchema,
  },
});

requireAnyRole(['admin', 'superuser']);

router.route({
  method: 'GET',
  path: '/:sushiId/report.json',
  handler: [
    commonHandlers,
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
  path: '/:sushiId/_import',
  handler: [
    commonHandlers,
    importSushi,
  ],
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
