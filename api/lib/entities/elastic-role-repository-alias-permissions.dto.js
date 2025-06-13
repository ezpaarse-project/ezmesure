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
  elasticRoleName: Joi.string().trim(),
  aliasPattern: Joi.string().trim(),

  elasticRole: Joi.object(),
  alias: Joi.object(),

  readonly: Joi.boolean(),
};

/**
 * Fields that cannot be changed but could be found in a request body
 */
const immutableFields = [
  'elasticRoleName',
  'elasticRole',
  'aliasPattern',
  'alias',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'elasticRole',
  'alias',
];

/**
 * Schema to be applied when creating a new alias permission
 */
const createSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  {
    elasticRoleName: () => schema.elasticRoleName,
    aliasPattern: () => schema.aliasPattern,
  },
);

/**
 * Schema to be applied when creating or updating a new alias permission
 */
const upsertSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  {
    elasticRoleName: () => schema.elasticRoleName,
    aliasPattern: () => schema.aliasPattern,
  },
);

/**
 * Schema to be applied when updating a alias permission
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
