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
  apiKeyId: Joi.string().trim(),
  apiKey: Joi.object(),

  aliasPattern: Joi.string().trim(),
  alias: Joi.object(),
};

/**
 * Fields that cannot be changed but could be found in a request body
 */
const immutableFields = [
  'apiKeyId',
  'apiKey',
  'aliasPattern',
  'alias',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'apiKey',
  'alias',
];

/**
 * Schema to be applied when creating a new alias permission
 */
const createSchema = withModifiers(
  schema,
  requireFields(['apiKeyId', 'aliasPattern']),
  ignoreFields(immutableFields),
);

/**
 * Schema to be applied when creating or updating a new alias permission
 */
const upsertSchema = withModifiers(
  schema,
  requireFields(['apiKeyId', 'aliasPattern']),
  ignoreFields(immutableFields),
);

/**
 * Schema to be applied when updating a membership
 */
const updateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
);

module.exports = {
  schema,
  allFields: Object.keys(schema),
  immutableFields,
  includableFields,
  createSchema: Joi.object(createSchema).required(),
  updateSchema: Joi.object(updateSchema).required(),
  upsertSchema: Joi.object(upsertSchema).required(),
};
