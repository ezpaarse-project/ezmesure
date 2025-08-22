const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
  requireFields,
} = require('./schema.utils');

const MEMBER_ROLES = {
  docContact: 'contact:doc',
  techContact: 'contact:tech',
  guest: 'guest',
};

const FEATURES = {
  institution: {
    read: 'institution:read',
    write: 'institution:write',
  },
  memberships: {
    read: 'memberships:read',
    write: 'memberships:write',
  },
  sushi: {
    read: 'sushi:read',
    write: 'sushi:write',
  },
  reporting: {
    read: 'reporting:read',
    write: 'reporting:write',
  },
};

const PERMISSIONS = Object.values(FEATURES).flatMap((feature) => Object.values(feature));

/**
 * Base schema
 * @type {Record<string, import('joi').AnySchema>}
 */
const schema = {
  username: Joi.string().trim(),
  user: Joi.object(),

  institutionId: Joi.string().trim(),
  institution: Joi.object(),

  roles: Joi.array().items(Joi.string().valid(...Object.values(MEMBER_ROLES))),
  permissions: Joi.array().items(Joi.string().valid(
    ...Object.values(FEATURES).flatMap((featurePerms) => Object.values(featurePerms)),
  )),

  locked: Joi.boolean(),
  comment: Joi.string().allow(''),

  spacePermissions: Joi.array().items(Joi.object()),
  repositoryPermissions: Joi.array().items(Joi.object()),
};

/**
 * Fields that cannot be changed but could be found in a request body
 */
const immutableFields = [
  'username',
  'user',
  'institutionId',
  'institution',
  'spacePermissions',
  'repositoryPermissions',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'user',
  'spacePermissions',
  'spacePermissions.space',
  'repositoryPermissions',
  'repositoryPermissions.repository',
  'repositoryAliasPermissions',
  'repositoryAliasPermissions.alias',
  'repositoryAliasPermissions.alias.repository',
  'institution',
  'institution.customProps',
  'institution.customProps.field',
  'institution.elasticRoles',
  'institution.elasticRoles.spacePermissions',
  'institution.elasticRoles.spacePermissions.space',
  'institution.elasticRoles.repositoryPermissions',
  'institution.elasticRoles.repositoryPermissions.repository',
  'institution.elasticRoles.repositoryAliasPermissions',
  'institution.elasticRoles.repositoryAliasPermissions.alias',
  'institution.elasticRoles.repositoryAliasPermissions.alias.repository',
  'roles',
  'roles.role',
];

/**
 * Fields that can only be changed by admins
 */
const adminRestrictedFields = [
  'locked',
];

/**
 * Schema to be applied when a regular user upserts a membership
 */
const upsertSchema = withModifiers(
  schema,
  requireFields(['username', 'institutionId']),
  ignoreFields(immutableFields),
  ignoreFields(adminRestrictedFields),
);

/**
 * Schema to be applied when an admin upserts membership
 */
const adminUpsertSchema = withModifiers(
  schema,
  requireFields(['username', 'institutionId']),
  ignoreFields(immutableFields),
);

module.exports = {
  MEMBER_ROLES,
  FEATURES,
  PERMISSIONS,
  schema,
  allFields: Object.keys(schema),
  immutableFields,
  includableFields,
  upsertSchema: Joi.object(upsertSchema).required(),
  adminUpsertSchema: Joi.object(adminUpsertSchema).required(),
};
