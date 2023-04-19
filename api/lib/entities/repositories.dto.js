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

  pattern: Joi.string().trim().min(1),
  type: Joi.string().trim().min(1),

  permissions: Joi.array().items(Joi.object()),
};

/**
 * Fields that cannot be changed but could be found in request body
 */
const immutableFields = [
  'id',
  'updatedAt',
  'createdAt',
  'institution',
  'permissions',
];

/**
 * Schema to be applied when an administrator creates a repository
 */
const adminCreateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  requireFields(['pattern', 'type', 'institutionId']),
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
const adminImportSchema = Joi.array().required().items({
  ...schema,
  id: schema.id,
});

module.exports = {
  schema,
  adminCreateSchema: Joi.object(adminCreateSchema).required(),
  adminUpdateSchema: Joi.object(adminUpdateSchema).required(),
  adminImportSchema,
};
