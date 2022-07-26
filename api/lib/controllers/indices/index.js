const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { requireJwt, requireUser, requireAnyRole } = require('../../services/auth');
const {
  getIndex,
  createIndex,
  deleteIndex,
} = require('./actions');

const indexNamePattern = /^[a-z0-9][a-z0-9_.-]*$/;

router.use(requireJwt, requireUser, requireAnyRole(['admin', 'superuser']));

router.route({
  method: 'GET',
  path: '/:index',
  handler: getIndex,
  validate: {
    params: {
      index: Joi.string().trim().regex(indexNamePattern).required(),
    },
  },
});

router.route({
  method: 'PUT',
  path: '/:index',
  handler: createIndex,
  validate: {
    query: {
      type: Joi.string().valid('ezpaarse', 'publisher'),
    },
    params: {
      index: Joi.string().trim().regex(indexNamePattern).required(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:index',
  handler: deleteIndex,
  validate: {
    params: {
      index: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
