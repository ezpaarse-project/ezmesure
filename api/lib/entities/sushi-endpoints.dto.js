const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
  requireFields,
  withDefaults,
} = require('./schema.utils');

/**
 * Base schema
 * @type {import('joi').SchemaLike}
 */
const schema = {
  id: Joi.string().trim(),
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  sushiUrl: Joi.string().uri(),
  vendor: Joi.string().min(1),
  description: Joi.string().allow(''),
  counterVersion: Joi.string().allow(''),
  technicalProvider: Joi.string().allow(''),
  requireCustomerId: Joi.boolean(),
  requireRequestorId: Joi.boolean(),
  requireApiKey: Joi.boolean(),
  ignoreReportValidation: Joi.boolean(),
  defaultCustomerId: Joi.string().allow(''),
  defaultRequestorId: Joi.string().allow(''),
  defaultApiKey: Joi.string().allow(''),
  paramSeparator: Joi.string().allow(''),
  tags: Joi.array().items(Joi.string()),

  credentials: Joi.array().items(Joi.object()),

  params: Joi.array().items(Joi.object({
    name: Joi.string().trim(),
    value: Joi.string().trim(),
    scope: Joi.string().trim().lowercase(),
  })),
};

/**
 * Fields that cannot be changed but could be found in request body
 */
const immutableFields = [
  'id',
  'updatedAt',
  'createdAt',
  'credentials',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'credentials',
  'credentials.institution',
];

/**
 * Schema to be applied when an administrator creates a SUSHI endpoint
 */
const adminCreateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  requireFields(['sushiUrl', 'vendor']),
  withDefaults({
    requireCustomerId: false,
    requireRequestorId: false,
    requireApiKey: false,
    ignoreReportValidation: false,
  }),
);

/**
 * Schema to be applied when an administrator updates a SUSHI endpoint
 */
const adminUpdateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
);

/**
 * Schema to be applied when an administrator import multiple SUSHI endpoints
 */
const adminImportSchema = withModifiers(
  adminCreateSchema,
  { id: () => schema.id },
);

module.exports = {
  schema,
  includableFields,
  adminCreateSchema: Joi.object(adminCreateSchema).required(),
  adminUpdateSchema: Joi.object(adminUpdateSchema).required(),
  adminImportSchema: Joi.object(adminImportSchema).required(),
};
