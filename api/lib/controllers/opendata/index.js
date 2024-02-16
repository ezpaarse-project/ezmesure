const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { requireJwt, requireUser, requireAdmin } = require('../../services/auth');

const {
  getOpenData,
  refreshOpenData,
} = require('./actions');

router.use(requireJwt, requireUser);

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

router.use(requireAdmin);

router.route({
  method: 'POST',
  path: '/_refresh',
  handler: refreshOpenData,
});

module.exports = router;
