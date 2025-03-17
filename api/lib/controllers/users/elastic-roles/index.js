const { Joi } = require('koa-joi-router');
const router = require('koa-joi-router')();

const { requireJwt, requireUser, requireAdmin } = require('../../../services/auth');

const { schema } = require('../../../entities/elastic-roles.dto');

const {
  getAll,
  getOne,
  connectRole,
  disconnectRole,
} = require('./actions');

router.use(requireJwt, requireUser, requireAdmin);

router.route({
  method: 'GET',
  path: '/',
  handler: getAll,
  validate: {
    params: {
      username: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:name',
  handler: getOne,
  validate: {
    params: {
      username: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'PUT',
  path: '/:name',
  handler: connectRole,
  validate: {
    type: 'json',
    params: {
      username: Joi.string().trim().required(),
      name: schema.name,
    },
    body: {},
  },
});

router.route({
  method: 'DELETE',
  path: '/:name',
  handler: disconnectRole,
  validate: {
    params: {
      username: Joi.string().trim().required(),
      name: schema.name,
    },
  },
});

module.exports = router;
