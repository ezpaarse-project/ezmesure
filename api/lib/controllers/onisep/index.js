const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { requireJwt, requireUser, requireAnyRole } = require('../../services/auth');

const {
  getOnisepData,
  refreshOnisepData,
} = require('./actions');

router.use(requireJwt, requireUser);
router.use(requireAnyRole(['institution_form', 'admin', 'superuser']));

router.route({
  method: 'GET',
  path: '/',
  handler: getOnisepData,
  validate: {
    query: {
      q: Joi.string().trim().allow(''),
    },
  },
});

router.use(requireAnyRole(['admin', 'superuser']));

router.route({
  method: 'POST',
  path: '/_refresh',
  handler: refreshOnisepData,
});

module.exports = router;
