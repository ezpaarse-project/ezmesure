const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { requireJwt, requireUser, requireAnyRole } = require('../../services/auth');
const {
  list,
  listIndexPatterns,
} = require('./actions');

router.use(requireJwt, requireUser, requireAnyRole(['admin', 'superuser']));

router.route({
  method: 'GET',
  path: '/',
  handler: list,
});

router.route({
  method: 'GET',
  path: '/:spaceId/index-patterns',
  handler: listIndexPatterns,
  validate: {
    params: {
      spaceId: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
