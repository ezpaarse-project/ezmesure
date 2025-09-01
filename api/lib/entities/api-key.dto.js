const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
  requireFields,
  withDefaults,
} = require('./schema.utils');

const { PERMISSIONS } = require('./memberships.dto');

const valueSchema = Joi.string().trim();

/**
 * Base schema
 * @type {Record<string, import('joi').AnySchema>}
 */
const schema = {
  id: Joi.string().trim(),
  // Protected field, may be present in responses
  // value: valueSchema,
  updatedAt: Joi.date(),
  createdAt: Joi.date(),
  expiresAt: Joi.date().min('now').allow(null),

  active: Joi.boolean(),
  activeUpdatedAt: Joi.date(),

  name: Joi.string().trim().allow('', null),
  description: Joi.string().trim().allow('', null),

  institutionId: Joi.string().trim(),
  institution: Joi.object(),

  username: Joi.string().trim(),
  user: Joi.object(),

  permissions: Joi.array().items(Joi.string().valid(...PERMISSIONS)),

  repositoryPermissions: Joi.array().items(Joi.object()),
  repositoryAliasPermissions: Joi.array().items(Joi.object()),
};

/**
 * Fields that cannot be changed but could be found in request body
 */
const immutableFields = [
  'id',
  'updatedAt',
  'createdAt',
  'activeUpdatedAt',
  'institutionId',
  'institution',
  'username',
  'user',
  'permissions',
  'repositoryPermissions',
  'repositoryAliasPermissions',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'institution',
  'user',
  'repositoryPermissions',
  'repositoryPermissions.repository',
  'repositoryAliasPermissions',
  'repositoryAliasPermissions.alias',
  'repositoryAliasPermissions.alias.repository',
];

/**
 * Schema to be applied when a regular user creates api keys
 */
const createSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  requireFields(['name', 'active']),
  withDefaults({ active: true }),
  {
    permissions: () => schema.permissions.required(),
    repositoryPermissions: () => schema.repositoryPermissions.required(),
    repositoryAliasPermissions: () => schema.repositoryAliasPermissions.required(),
  },
);

/**
 * Schema to be applied when a regular user updates api keys
 */
const updateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  requireFields(['name', 'description', 'active']),
);

/**
 * Schema to be applied when a regular user import multiple api keys
 */
const importSchema = Joi.array().required().items({
  ...createSchema,
  value: valueSchema,
});

module.exports = {
  schema,
  createSchema: Joi.object(createSchema).required(),
  updateSchema: Joi.object(updateSchema).required(),
  importSchema,
  includableFields,
};
