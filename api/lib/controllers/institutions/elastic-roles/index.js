const router = require('koa-joi-router')();

const { Joi } = require('koa-joi-router');
const { requireJwt, requireUser, requireAdmin } = require('../../../services/auth');

const { schema } = require('../../../entities/elastic-roles.dto');

const {
  standardQueryParams,

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
      institutionId: Joi.string().trim().required(),
    },
    query: standardQueryParams.manyValidation,
  },
});

router.route({
  method: 'GET',
  path: '/:name',
  handler: getOne,
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
      name: schema.name,
    },
    query: standardQueryParams.oneValidation,
  },
});

router.route({
  method: 'PUT',
  path: '/:name',
  handler: connectRole,
  validate: {
    type: 'json',
    params: {
      institutionId: Joi.string().trim().required(),
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
      institutionId: Joi.string().trim().required(),
      name: schema.name,
    },
  },
});

module.exports = router;
