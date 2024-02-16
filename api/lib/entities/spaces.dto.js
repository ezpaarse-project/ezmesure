const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
  requireFields,
} = require('./schema.utils');

/**
 * Base schema
 * @type import('joi').SchemaLike
 */
const schema = {
  id: Joi.string().trim(),
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  institutionId: Joi.string().trim(),
  institution: Joi.object(),

  type: Joi.string().trim().min(1),
  name: Joi.string().trim().min(1),
  description: Joi.string().trim().allow(''),
  initials: Joi.string().trim().allow('').max(2),
  color: Joi.string().trim().allow(''),

  indexPatterns: Joi.array().items(Joi.object({
    title: Joi.string().required().min(1),
    timeFieldName: Joi.string(),
  })),

  permissions: Joi.array().items(Joi.object()),
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
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'permissions',
  'institution',
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
 * Schema to be applied when an administrator imports multiple spaces
 */
const adminImportSchema = Joi.array().required().items(schema);

module.exports = {
  schema,
  includableFields,
  adminCreateSchema: Joi.object(adminCreateSchema).required(),
  adminUpdateSchema: Joi.object(adminUpdateSchema).required(),
  adminImportSchema,
};
