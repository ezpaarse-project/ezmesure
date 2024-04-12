const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireJwt,
  requireUser,
  requireAdmin,
} = require('../../services/auth');

const {
  getHarvests,
} = require('./actions');

router.use(
  requireJwt,
  requireUser,
  requireAdmin,
);

const {
  includableFields,
} = require('../../entities/harvest.dto');

const stringOrArray = Joi.alternatives().try(
  Joi.string().trim().min(1),
  Joi.array().items(Joi.string().trim().min(1)).min(1),
);

router.route({
  method: 'GET',
  path: '/',
  handler: [
    getHarvests,
  ],
  validate: {
    query: Joi.object({
      from: Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
      to: Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
      harvestedBefore: Joi.date().iso(),
      harvestedAfter: Joi.date().iso(),
      reportId: stringOrArray,
      credentialsId: stringOrArray,
      endpointId: stringOrArray,
      status: stringOrArray,
      errorCode: stringOrArray,
      institutionId: stringOrArray,
      tags: stringOrArray,
      packages: stringOrArray,
      size: Joi.number().min(0),
      page: Joi.number().min(1),
      sort: Joi.string(),
      order: Joi.string().valid('asc', 'desc'),
      distinct: stringOrArray,
      include: Joi.array().single().items(Joi.string().valid(...includableFields)),
    }).rename('include[]', 'include'),
  },
});

module.exports = router;
