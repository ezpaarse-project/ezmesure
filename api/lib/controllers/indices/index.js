const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { requireJwt, requireUser, requireAnyRole } = require('../../services/auth');
const {
  createIndex,
} = require('./actions');

const indexNamePattern = /^[a-z0-9][a-z0-9_.-]*$/;

router.use(requireJwt, requireUser, requireAnyRole(['admin', 'superuser']));

router.route({
  method: 'PUT',
  path: '/:index',
  handler: createIndex,
  validate: {
    params: {
      index: Joi.string().trim().regex(indexNamePattern).required(),
    },
  },
});

module.exports = router;
