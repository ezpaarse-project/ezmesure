const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { requireJwt, requireUser, requireAdmin } = require('../../services/auth');

const {
  list,
} = require('./actions');

router.use(requireJwt, requireUser, requireAdmin);

router.route({
  method: 'GET',
  path: '/',
  handler: list,
  validate: {
    query: {
      type: Joi.string(),
    },
  },
});

module.exports = router;
