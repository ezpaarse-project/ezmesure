const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const {
  requireJwt,
  requireUser,
  requireAdmin,
} = require('../../services/auth');

const { stringOrArrayValidation } = require('../../services/std-query');

const {
  standardQueryParams,
  getHarvests,
  deleteHarvestsByQuery,
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
    getHarvests,
  ],
  validate: {
    query: standardQueryParams.manyValidation.append({
      period: Joi.forbidden(),
      'period:from': Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
      'period:to': Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
      endpointId: stringOrArrayValidation,
      institutionId: stringOrArrayValidation,
      tags: stringOrArrayValidation,
      packages: stringOrArrayValidation,
    }),
  },
});

router.route({
  method: 'DELETE',
  path: '/_by-query',
  handler: [
    deleteHarvestsByQuery,
  ],
  validate: {
    type: 'json',
    body: Joi.object({
      credentialsId: Joi.string().trim().required(),
      reportId: Joi.string().trim().required(),
      period: Joi.object({
        from: Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/).required(),
        to: Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/).required(),
      }).required(),
      status: Joi.string().trim(),
    }),
  },
});

module.exports = router;
