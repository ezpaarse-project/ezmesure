const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { adminUpdateSchema, adminCreateSchema, includableFields } = require('../../entities/users.dto');

const { requireJwt, requireUser, requireAdmin } = require('../../services/auth');
const {
  list,
  getUser,
  createOrReplaceUser,
  updateUser,
  deleteUser,
} = require('./actions');

router.use(requireJwt, requireUser);

router.route({
  method: 'GET',
  path: '/',
  handler: list,
  validate: {
    query: {
      q: Joi.string().trim(),
      size: Joi.number().integer().min(0),
      source: Joi.string().trim(),
      include: Joi.array().single().items(Joi.string().valid(...includableFields)),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:username',
  handler: getUser,
  validate: {
    params: {
      username: Joi.string().trim().required(),
    },
  },
});

router.use(requireAdmin);

router.route({
  method: 'PUT',
  path: '/:username',
  handler: createOrReplaceUser,
  validate: {
    type: 'json',
    params: {
      username: Joi.string().trim().required(),
    },
    body: adminCreateSchema,
  },
});

router.route({
  method: 'PATCH',
  path: '/:username',
  handler: updateUser,
  validate: {
    type: 'json',
    params: {
      username: Joi.string().trim().required(),
    },
    body: adminUpdateSchema,
  },
});

router.route({
  method: 'DELETE',
  path: '/:username',
  handler: deleteUser,
  validate: {
    params: {
      username: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
