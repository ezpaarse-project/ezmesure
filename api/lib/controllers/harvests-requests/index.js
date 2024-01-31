const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireJwt,
  requireUser,
  requireAdmin,
} = require('../../services/auth');

const {
  getRequests,
  getJobs,
  getJobsMeta,
  includableFields,
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
    getRequests,
  ],
  validate: {
    query: Joi.object({
      size: Joi.number().min(-1),
      page: Joi.number().min(1),
      sort: Joi.string(),
      order: Joi.string().valid('asc', 'desc'),
    }),
  },
});

router.route({
  method: 'GET',
  path: '/:harvestId/jobs',
  handler: [
    getJobs,
  ],
  validate: {
    params: {
      harvestId: Joi.string().trim().required(),
    },
    query: Joi.object({
      from: Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
      to: Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
      reportType: Joi.string().trim(),
      vendor: Joi.string().trim(),
      institution: Joi.string().trim(),
      status: Joi.string().trim(),
      tags: Joi.string().trim(),
      size: Joi.number().min(-1),
      page: Joi.number().min(1),
      sort: Joi.string(),
      order: Joi.string().valid('asc', 'desc'),
      include: Joi.array().single().items(Joi.string().valid(...includableFields)),
    }).rename('include[]', 'include'),
  },
});

router.route({
  method: 'GET',
  path: '/:harvestId/jobs/_meta',
  handler: [
    getJobsMeta,
  ],
  validate: {
    params: {
      harvestId: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
