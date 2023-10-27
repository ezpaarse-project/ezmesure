const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const { requireJwt, requireUser, requireAdmin } = require('../../services/auth');
const {
  copyDashboard,
  exportDashboard,
  importDashboard,
  listDashboards,
} = require('./actions');

router.use(requireJwt, requireUser, requireAdmin);

router.route({
  method: 'GET',
  path: '/',
  handler: listDashboards,
  validate: {
    query: {
      space: Joi.string().trim(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/_export',
  handler: exportDashboard,
  validate: {
    query: {
      space: Joi.string().trim(),
      dashboard: Joi.alternatives(
        Joi.array().items(Joi.string().trim()),
        Joi.string().trim(),
      ).required(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/_import',
  handler: importDashboard,
  validate: {
    type: 'json',
    query: {
      space: Joi.string().trim(),
      'index-pattern': Joi.string().trim(),
      force: Joi.boolean().default(false),
    },
    body: {
      version: Joi.string().trim().required().regex(/^[\d.]+$/),
      objects: Joi.array().items(Joi.object()),
    },
  },
});

router.route({
  method: 'POST',
  path: '/_copy',
  handler: copyDashboard,
  validate: {
    type: 'json',
    query: {
      force: Joi.boolean().default(false),
    },
    body: {
      source: Joi.object({
        space: Joi.string().trim(),
        dashboard: Joi.alternatives(
          Joi.array().items(Joi.string().trim()),
          Joi.string().trim(),
        ).required(),
      }).required(),
      target: Joi.object({
        space: Joi.string().trim(),
        indexPattern: Joi.string().trim(),
      }),
    },
  },
});

module.exports = router;
