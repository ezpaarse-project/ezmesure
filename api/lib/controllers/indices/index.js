const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { requireJwt, requireUser, requireAdmin } = require('../../services/auth');
const {
  getIndex,
  createIndex,
  deleteIndex,
} = require('./actions');

const indexNamePattern = /^[a-z0-9][a-z0-9_.-]*$/;

router.use(requireJwt, requireUser, requireAdmin);

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
