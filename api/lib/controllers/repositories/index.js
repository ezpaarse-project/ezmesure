const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const {
  requireJwt,
  requireUser,
  fetchRepository,
  requireAdmin,
  requireMemberPermissions,
  fetchInstitution,
} = require('../../services/auth');

const {
  getMany,
  getOne,
  createOne,
  updateOne,
  deleteOne,
  upsertPermission,
  deletePermission,
} = require('./actions');

const {
  adminCreateSchema,
  adminUpdateSchema,
} = require('../../entities/repositories.dto');

const { FEATURES } = require('../../entities/memberships.dto');

router.use(requireJwt, requireUser);

router.route({
  method: 'PUT',
  path: '/:pattern/permissions/:username',
  handler: [
    fetchRepository(),
    fetchInstitution({ getId: (ctx) => ctx?.state?.repository?.institutionId }),
    requireMemberPermissions(FEATURES.memberships.write),
    upsertPermission,
  ],
  validate: {
    type: 'json',
    params: {
      pattern: Joi.string().trim().required(),
      username: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:pattern/permissions/:username',
  handler: [
    fetchRepository(),
    fetchInstitution({ getId: (ctx) => ctx?.state?.repository?.institutionId }),
    requireMemberPermissions(FEATURES.memberships.write),
    deletePermission,
  ],
  validate: {
    params: {
      pattern: Joi.string().trim().required(),
      username: Joi.string().trim().required(),
    },
  },
});

router.use(requireAdmin);

router.get('/', {
  method: 'GET',
  path: '/',
  handler: getMany,
  validate: {
    params: {
      q: Joi.string(),
      type: Joi.string(),
      institutionId: Joi.string(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/:pattern',
  handler: [
    fetchRepository(),
    getOne,
  ],
});

router.route({
  method: 'POST',
  path: '/',
  handler: createOne,
  validate: {
    type: 'json',
    body: adminCreateSchema,
  },
});

router.route({
  method: 'PATCH',
  path: '/:pattern',
  handler: [
    fetchRepository(),
    updateOne,
  ],
  validate: {
    type: 'json',
    body: adminUpdateSchema,
    params: {
      pattern: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:pattern',
  handler: [
    fetchRepository(),
    deleteOne,
  ],
  validate: {
    params: {
      pattern: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
