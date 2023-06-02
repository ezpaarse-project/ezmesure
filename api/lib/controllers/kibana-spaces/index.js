const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');
const {
  requireJwt,
  requireUser,
  fetchSpace,
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
} = require('../../entities/spaces.dto');

const { FEATURES } = require('../../entities/memberships.dto');

router.use(requireJwt, requireUser);

router.route({
  method: 'PUT',
  path: '/:spaceId/permissions/:username',
  handler: [
    fetchSpace(),
    fetchInstitution({ getId: (ctx) => ctx?.state?.space?.institutionId }),
    requireMemberPermissions(FEATURES.memberships.write),
    upsertPermission,
  ],
  validate: {
    type: 'json',
    params: {
      spaceId: Joi.string().trim().required(),
      username: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:spaceId/permissions/:username',
  handler: [
    fetchSpace(),
    fetchInstitution({ getId: (ctx) => ctx?.state?.space?.institutionId }),
    requireMemberPermissions(FEATURES.memberships.write),
    deletePermission,
  ],
  validate: {
    params: {
      spaceId: Joi.string().trim().required(),
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
  path: '/:spaceId',
  handler: [
    fetchSpace(),
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
  path: '/:spaceId',
  handler: [
    fetchSpace(),
    updateOne,
  ],
  validate: {
    type: 'json',
    body: adminUpdateSchema,
    params: {
      spaceId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/:spaceId',
  handler: [
    fetchSpace(),
    deleteOne,
  ],
  validate: {
    params: {
      spaceId: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
