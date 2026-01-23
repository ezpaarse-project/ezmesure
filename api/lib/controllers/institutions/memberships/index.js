const router = require('koa-joi-router')();
const { Joi } = require('koa-joi-router');

const { FEATURES } = require('../../../entities/memberships.dto');

const {
  requireJwt,
  requireUser,
  fetchInstitution,
  requireMemberPermissions,
} = require('../../../services/auth');

const {
  standardQueryParams,

  getInstitutionMembers,
  addInstitutionMember,
  removeInstitutionMember,
  getInstitutionMember,
  requestMembership,
  addInstitutionMemberRole,
  removeInstitutionMemberRole,
} = require('./actions');

router.use(requireJwt, requireUser);

router.route({
  method: 'POST',
  path: '/_request_membership',
  handler: [
    fetchInstitution(),
    requestMembership,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'GET',
  path: '/memberships',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.memberships.read),
    getInstitutionMembers,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
    },
    query: standardQueryParams.manyValidation,
  },
});

router.route({
  method: 'GET',
  path: '/memberships/:username',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.memberships.read),
    getInstitutionMember,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
      username: Joi.string().trim().required(),
    },
    query: standardQueryParams.oneValidation,
  },
});

router.route({
  method: 'PUT',
  path: '/memberships/:username',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.memberships.write),
    addInstitutionMember,
  ],
  validate: {
    type: 'json',
    params: {
      institutionId: Joi.string().trim().required(),
      username: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/memberships/:username',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.memberships.write),
    removeInstitutionMember,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
      username: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'DELETE',
  path: '/memberships/:username/roles/:roleId',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.memberships.write),
    removeInstitutionMemberRole,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
      username: Joi.string().trim().required(),
      roleId: Joi.string().trim().required(),
    },
  },
});

router.route({
  method: 'PUT',
  path: '/memberships/:username/roles/:roleId',
  handler: [
    fetchInstitution(),
    requireMemberPermissions(FEATURES.memberships.write),
    addInstitutionMemberRole,
  ],
  validate: {
    params: {
      institutionId: Joi.string().trim().required(),
      username: Joi.string().trim().required(),
      roleId: Joi.string().trim().required(),
    },
  },
});

module.exports = router;
