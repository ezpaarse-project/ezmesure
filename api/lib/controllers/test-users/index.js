const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const config = require('config');

const { requireJwt, requireUser, requireAdmin } = require('../../services/auth');
const {
  getManyTestUsers,
  createTestUser,
  deleteTestUser,
} = require('./actions');

const maxLifespan = Number.parseInt(config.get('testUsers.lifespan.max'), 10);
const defaultLifespan = Number.parseInt(config.get('testUsers.lifespan.default'), 10);

router.use(requireJwt, requireUser, requireAdmin);

router.route({
  method: 'GET',
  path: '/',
  handler: getManyTestUsers,
  validate: {
    query: {
      cloneOf: Joi.string().trim(),
    },
  },
});

router.route({
  method: 'POST',
  path: '/',
  handler: createTestUser,
  validate: {
    type: 'json',
    body: {
      cloneOf: Joi.string().trim().required(),
      lifespan: Joi.number().min(1).max(maxLifespan).default(defaultLifespan),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:username',
  handler: deleteTestUser,
  validate: {
    params: {
      username: Joi.string().trim(),
    },
  },
});

module.exports = router;
