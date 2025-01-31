const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
  requireFields,
} = require('./schema.utils');

/**
 * Base schema
 * @type {import('joi').SchemaLike}
 */
const schema = {
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  pattern: Joi.string().trim().min(1),
  target: Joi.string().trim().min(1),

  filters: Joi.array().items(Joi.object({
    field: Joi.string().trim().min(1).required(),
    isNot: Joi.boolean().default(false),
    value: Joi.alternatives([
      // Null values are allowed to check if empty
      Joi.string().trim().min(1), // Exact match
      Joi.array().items(Joi.string().trim().min(1)), // One of
    ]).allow(null),
  })).allow(null),

  institutions: Joi.array().items(Joi.object()),
  repository: Joi.object(),
  permissions: Joi.array().items(Joi.object()),
};

/**
 * Fields that cannot be changed but could be found in request body
 */
const immutableFields = [
  'updatedAt',
  'createdAt',
  'institutions',
  'repository',
  'permissions',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'institutions',
  'repository',
  'permissions',
];

/**
 * Schema to be applied when an administrator creates a repository
 */
const adminCreateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  requireFields(['pattern', 'target']),
);

/**
 * Schema to be applied when an administrator connect a repository to an institution
 */
const adminCreateOrConnectSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  requireFields(['target']),
);

/**
 * Schema to be applied when an administrator updates a repository
 */
const adminUpdateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
);

/**
 * Schema to be applied when an administrator imports multiple repositories
 */
const adminImportSchema = withModifiers(
  adminCreateSchema,
  {
    pattern: () => schema.pattern,
    institutions: () => schema.institutions,
    permissions: () => schema.permissions,
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
