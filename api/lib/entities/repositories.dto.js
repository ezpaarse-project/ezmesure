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

  institutions: Joi.array().items(Joi.object()),

  pattern: Joi.string().trim().min(1),
  type: Joi.string().trim().min(1),

  permissions: Joi.array().items(Joi.object()),
  aliases: Joi.array().items(Joi.object()),
};

/**
 * Fields that cannot be changed but could be found in request body
 */
const immutableFields = [
  'updatedAt',
  'createdAt',
  'institutions',
  'permissions',
  'aliases',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'permissions',
  'aliases',
  'institutions',
];

/**
 * Schema to be applied when an administrator creates a repository
 */
const adminCreateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  requireFields(['pattern', 'type']),
);

/**
 * Schema to be applied when an administrator connect a repository to an institution
 */
const adminCreateOrConnectSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  requireFields(['type']),
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
