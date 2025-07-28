const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
  requireFields,
} = require('./schema.utils');

/**
 * Base schema
 * @type {Record<string, import('joi').AnySchema>}
 */
const schema = {
  id: Joi.string().trim(),
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  institutionId: Joi.string().trim(),
  institution: Joi.object(),

  type: Joi.string().trim().min(1),
  name: Joi.string().trim().min(1),
  description: Joi.string().trim().allow('').empty(null),
  initials: Joi.string().trim().allow('').max(2)
    .empty(null),
  color: Joi.string().trim().allow('').empty(null),
  imageUrl: Joi.string().trim().base64().allow(null),

  disabledFeatures: Joi.array().items(Joi.string().trim().min(1)),

  indexPatterns: Joi.array().items(Joi.object({
    title: Joi.string().required().min(1),
    timeFieldName: Joi.string(),
  })),

  permissions: Joi.array().items(Joi.object()),
  elasticRolePermissions: Joi.array().items(Joi.object()),
};

/**
 * Fields that cannot be changed but could be found in request body
 */
const immutableFields = [
  'id',
  'type',
  'updatedAt',
  'createdAt',
  'institution',
  'permissions',
  'elasticRolePermissions',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'permissions',
  'institution',
  'elasticRolePermissions',
];

/**
 * Schema to be applied when an administrator creates a space
 */
const adminCreateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  {
    id: () => schema.id,
    type: () => schema.type,
  },
  requireFields(['id', 'name', 'type', 'institutionId']),
);

/**
 * Schema to be applied when an administrator updates a space
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
    id: () => schema.id,
    permissions: () => schema.permissions,
  },
);

module.exports = {
  schema,
  includableFields,
  adminCreateSchema: Joi.object(adminCreateSchema).required(),
  adminUpdateSchema: Joi.object(adminUpdateSchema).required(),
  adminImportSchema: Joi.object(adminImportSchema).required(),
};
