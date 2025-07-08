const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { requireJwt, requireUser, requireAdmin } = require('../../services/auth');

const {
  standardQueryParams,
  getAll,
  getOne,
} = require('./actions');

router.use(requireJwt, requireUser, requireAdmin);

router.route({
  method: 'GET',
  path: '/',
  handler: [getAll],
  validate: {
    query: standardQueryParams.manyValidation.append({
      // Override validation to disallow time
      'date:from': Joi.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
      'date:to': Joi.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
    }),
  },
});

router.route({
  method: 'GET',
  path: '/:id',
  handler: [getOne],
  validate: {
    params: {
      id: Joi.string().trim().required(),
    },
    query: standardQueryParams.oneValidation,
  },
});

module.exports = router;
