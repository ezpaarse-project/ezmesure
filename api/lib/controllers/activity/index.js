const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const handleElasticErrors = require('../../utils/elastic-error-handler');

const { requireJwt, requireUser, requireAdmin } = require('../../services/auth');
const { search, getOne } = require('./actions');

router.use(requireJwt, requireUser, requireAdmin);

const stringOrArray = Joi.alternatives().try(
  Joi.string().trim().min(1),
  Joi.array().items(Joi.string().trim().min(1)).min(1),
);

router.route({
  method: 'GET',
  path: '/',
  handler: [handleElasticErrors, search],
  validate: {
    query: {
      size: Joi.number(),
      page: Joi.number(),
      sort: Joi.string().valid('datetime', 'action', 'user.name'),
      order: Joi.string().valid('asc', 'desc'),
      type: stringOrArray,
      username: stringOrArray,
      date: Joi.date().iso().raw(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:metricId',
  handler: [handleElasticErrors, getOne],
  validate: {
    params: {
      metricId: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
