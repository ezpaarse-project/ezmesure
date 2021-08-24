const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { requireJwt, requireUser, requireAnyRole } = require('../../services/auth');

const {
  getOpenData,
  refreshOpenData,
} = require('./actions');

router.use(requireJwt, requireUser);
router.use(requireAnyRole(['institution_form', 'admin', 'superuser']));

router.route({
  method: 'GET',
  path: '/',
  handler: getOpenData,
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
  handler: refreshOpenData,
});

module.exports = router;
