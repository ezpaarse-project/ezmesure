const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
} = require('./schema.utils');

/**
 * Base schema
 * @type {Record<string, import('joi').AnySchema>}
 */
const schema = {
  id: Joi.string().trim(),

  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  sourceDashboardId: Joi.string().trim().min(1),
  sourceSpaceId: Joi.string().trim().min(1),

  data: Joi.object(),
  tags: Joi.array().items(Joi.object()),

  kibanaVersion: Joi.string().trim(),
  name: Joi.string().trim(),
  description: Joi.string().trim(),

  collectionId: Joi.string().trim().min(1).allow(null),
  collection: Joi.object(),
};

/**
 * Fields that cannot be changed but could be found in request body
 */
const immutableFields = [
  'updatedAt',
  'createdAt',
  'data',
  'tags',
  'kibanaVersion',
  'name',
  'description',
  'collection',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'collection',
];

/**
 * Schema to be applied when an administrator creates a space
 */
const adminCreateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
);

/**
 * Schema to be applied when an administrator updates a space
 */
const adminUpsertSchema = withModifiers(
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
    collection: () => schema.collection,
  },
);

module.exports = {
  schema,
  includableFields,
  adminCreateSchema: Joi.object(adminCreateSchema).required(),
  adminUpsertSchema: Joi.object(adminUpsertSchema).required(),
  adminImportSchema: Joi.object(adminImportSchema).required(),
};
