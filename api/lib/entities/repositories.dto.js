const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
  requireFields,
} = require('./schema.utils');

const mappingSchema = Joi.object({
  properties: Joi.object().pattern(
    Joi.string(),
    Joi.object({
      type: Joi.string().required().valid('geo_point', 'geo_shape', 'ip', 'binary', 'keyword', 'text', 'date', 'date_nanos', 'boolean', 'integer', 'long', 'short', 'byte', 'float', 'double'),
      ignoreMalformed: Joi.boolean().default(false),
      format: Joi.string().default(() => undefined),
      subFields: Joi.array().items(Joi.string().valid('date')).default([]),
    }),
  ),
});

const settingsSchema = Joi.object({
  defaultPipeline: Joi.string().allow(null),
  finalPipeline: Joi.string().allow(null),
});

/**
 * Base schema
 * @type {Record<string, import('joi').AnySchema>}
 */
const schema = {
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  institutions: Joi.array().items(Joi.object()),

  pattern: Joi.string().trim().min(1),
  type: Joi.string().trim().min(1),

  mapping: mappingSchema,
  settings: settingsSchema,

  permissions: Joi.array().items(Joi.object()),
  elasticRolePermissions: Joi.array().items(Joi.object()),
  aliases: Joi.array().items(Joi.object()),
  aliasTemplates: Joi.array().items(Joi.object()),
  harvestJobs: Joi.array().items(Joi.object()),
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
  'aliasTemplates',
  'elasticRolePermissions',
  'harvestJobs',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'permissions',
  'aliases',
  'aliasTemplates',
  'institutions',
  'elasticRolePermissions',
  'harvestJobs',
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
  mappingSchema,
  settingsSchema,
  includableFields,
  adminCreateSchema: Joi.object(adminCreateSchema).required(),
  adminCreateOrConnectSchema: Joi.object(adminCreateOrConnectSchema).required(),
  adminUpdateSchema: Joi.object(adminUpdateSchema).required(),
  adminImportSchema: Joi.object(adminImportSchema).required(),
};
