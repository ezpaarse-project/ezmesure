const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
  requireFields,
  withDefaults,
} = require('./schema.utils');

/**
 * Base schema
 * @type {Record<string, import('joi').AnySchema>}
 */
const schema = {
  apiKeyId: Joi.string().trim(),
  apiKey: Joi.object(),

  pattern: Joi.string().trim(),
  repository: Joi.object(),

  readonly: Joi.boolean(),
};

/**
 * Fields that cannot be changed but could be found in a request body
 */
const immutableFields = [
  'apiKeyId',
  'apiKey',
  'pattern',
  'repository',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'apiKey',
  'repository',
];

/**
 * Schema to be applied when creating a new repository permission
 */
const createSchema = withModifiers(
  schema,
  requireFields(['apiKeyId', 'pattern']),
  ignoreFields(immutableFields),
  withDefaults({
    readonly: false,
  }),
);

/**
 * Schema to be applied when creating or updating a new repository permission
 */
const upsertSchema = withModifiers(
  schema,
  requireFields(['apiKeyId', 'pattern']),
  ignoreFields(immutableFields),
  withDefaults({
    readonly: false,
  }),
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
