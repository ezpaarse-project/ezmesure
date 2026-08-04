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

  name: Joi.string().trim().min(1),
  description: Joi.string().trim().allow('').empty(null),

  dashboards: Joi.array().items(Joi.object()),
  spaces: Joi.array().items(Joi.object()),
};

/**
 * Fields that cannot be changed but could be found in request body
 */
const immutableFields = [
  'id',
  'updatedAt',
  'createdAt',
  'dashboards',
  'spaces',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'dashboards',
  'spaces',
];

/**
 * Schema to be applied when an administrator creates a space
 */
const adminCreateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  { id: () => schema.id },
  requireFields(['id', 'name']),
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
    collections: () => schema.collections,
  },
);

module.exports = {
  schema,
  includableFields,
  adminCreateSchema: Joi.object(adminCreateSchema).required(),
  adminUpdateSchema: Joi.object(adminUpdateSchema).required(),
  adminImportSchema: Joi.object(adminImportSchema).required(),
};
