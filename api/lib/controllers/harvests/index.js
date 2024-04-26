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
      'period:from': Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
      'period:to': Joi.string().regex(/^[0-9]{4}-[0-9]{2}$/),
      endpointId: Joi.string().trim(),
      institutionId: Joi.string().trim(),
      tags: stringOrArrayValidation,
      packages: stringOrArrayValidation,
    }),
  },
});

module.exports = router;
