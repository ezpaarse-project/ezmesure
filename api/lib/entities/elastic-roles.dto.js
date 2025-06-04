const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
} = require('./schema.utils');

const roleNamePattern = /^[a-z0-9][a-z0-9_.-]*$/i;

/**
 * Base schema
 * @type {Record<string, import('joi').AnySchema>}
 */
const schema = {
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  name: Joi.string().trim().min(1).regex(roleNamePattern),

  users: Joi.array().items(Joi.object()),
  institutions: Joi.array().items(Joi.object()),
  repositoryPermissions: Joi.array().items(Joi.object()),
  repositoryAliasPermissions: Joi.array().items(Joi.object()),
  spacePermissions: Joi.array().items(Joi.object()),
};

/**
 * Fields that cannot be changed but could be found in request body
 */
const immutableFields = [
  'name',
  'updatedAt',
  'createdAt',
  'users',
  'institutions',
  'repositoryPermissions',
  'repositoryAliasPermissions',
  'spacePermissions',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'users',
  'institutions',
  'repositoryPermissions',
  'repositoryPermissions.repository',
  'repositoryAliasPermissions',
  'repositoryAliasPermissions.alias',
  'repositoryAliasPermissions.alias.repository',
  'spacePermissions',
  'spacePermissions.space',
];

/**
 * Schema to be applied when an administrator creates a role
 */
const adminCreateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  { name: () => schema.name },
);

/**
 * Schema to be applied when an administrator connect a role
 */
const adminCreateOrConnectSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  { name: () => schema.name },
);

/**
 * Schema to be applied when an administrator updates a role
 */
const adminUpdateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
);

/**
 * Schema to be applied when an administrator imports multiple roles
 */
const adminImportSchema = withModifiers(
  adminCreateSchema,
  {
    users: () => schema.users,
    institutions: () => schema.institutions,
    repositoryPermissions: () => schema.repositoryPermissions,
    repositoryAliasPermissions: () => schema.repositoryAliasPermissions,
    spacePermissions: () => schema.spacePermissions,
  },
);

module.exports = {
  schema,
  includableFields,
  adminCreateSchema: Joi.object(adminCreateSchema).required(),
  adminCreateOrConnectSchema: Joi.object(adminCreateOrConnectSchema).required(),
  adminUpdateSchema: Joi.object(adminUpdateSchema).required(),
  adminImportSchema: Joi.object(adminImportSchema).required(),
};
