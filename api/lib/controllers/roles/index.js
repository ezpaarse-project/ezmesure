const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { requireJwt, requireUser, requireAnyRole } = require('../../services/auth');
const {
  listRoles,
  getRole,
  createRole,
  deleteRole,
} = require('./actions');

const roleNamePattern = /^[a-z0-9][a-z0-9_.-]*$/i;

router.use(requireJwt, requireUser, requireAnyRole(['admin', 'superuser']));

router.route({
  method: 'GET',
  path: '/',
  handler: listRoles,
  validate: {
    query: {
      reserved: Joi.boolean().default(false),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:roleName',
  handler: getRole,
  validate: {
    params: {
      roleName: Joi.string().trim().required().regex(roleNamePattern),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:roleName',
  handler: deleteRole,
  validate: {
    params: {
      roleName: Joi.string().trim().required().regex(roleNamePattern),
    },
  },
});

router.route({
  method: 'PUT',
  path: '/:roleName',
  handler: createRole,
  validate: {
    type: 'json',
    params: {
      roleName: Joi.string().trim().required().regex(roleNamePattern),
    },
    body: {
      metadata: Joi.object().unknown(true),

      elasticsearch: Joi.object({
        run_as: Joi.array().items(Joi.string()),
        indices: Joi.array().items(
          Joi.object({
            names: Joi.array().items(Joi.string()),
            privileges: Joi.array().items(Joi.string()),
          }),
        ),
      }),

      kibana: Joi.array().items(
        Joi.object({
          base: Joi.array().length(1).items(Joi.string().valid('read', 'all')),
          spaces: Joi.array().items(Joi.string()).required(),
          feature: Joi.object().unknown(true).pattern(
            Joi.any(),
            Joi.array().length(1).items(Joi.string().valid('read', 'all')),
          ),
        }).required().xor('base', 'feature'),
      ),
    },
  },
});

module.exports = router;
