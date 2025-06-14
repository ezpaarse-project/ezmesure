const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
  requireFields,
  filtersSchema,
} = require('./schema.utils');

/**
 * Base schema
 * @type {Record<string, import('joi').AnySchema>}
 */
const schema = {
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  templateId: Joi.string().trim().allow(null),
  template: Joi.object(),

  pattern: Joi.string().trim().min(1),
  target: Joi.string().trim().min(1),

  filters: Joi.array().min(1).items(filtersSchema).allow(null),

  institutions: Joi.array().items(Joi.object()),
  repository: Joi.object(),
  permissions: Joi.array().items(Joi.object()),
  elasticRolePermissions: Joi.array().items(Joi.object()),
};

/**
 * Fields that cannot be changed but could be found in request body
 */
const immutableFields = [
  'updatedAt',
  'createdAt',
  'institutions',
  'template',
  'repository',
  'permissions',
  'elasticRolePermissions',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'institutions',
  'repository',
  'permissions',
  'elasticRolePermissions',
];

/**
 * Schema to be applied when an administrator creates a repository alias
 */
const adminCreateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  requireFields(['pattern', 'target']),
);

/**
 * Schema to be applied when an administrator connect a repository alias to an institution
 */
const adminCreateOrConnectSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  requireFields(['target']),
);

/**
 * Schema to be applied when an administrator updates a repository alias
 */
const adminUpdateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
);

/**
 * Schema to be applied when an administrator imports multiple repository aliases
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
