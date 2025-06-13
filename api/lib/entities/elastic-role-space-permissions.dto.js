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
  spaceId: Joi.string().trim(),

  elasticRole: Joi.object(),
  space: Joi.object(),

  readonly: Joi.boolean(),
};

/**
 * Fields that cannot be changed but could be found in a request body
 */
const immutableFields = [
  'elasticRoleName',
  'elasticRole',
  'spaceId',
  'space',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'elasticRole',
  'space',
];

/**
 * Schema to be applied when creating a new space permission
 */
const createSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  {
    elasticRoleName: () => schema.elasticRoleName,
    spaceId: () => schema.spaceId,
  },
);

/**
 * Schema to be applied when creating or updating a new space permission
 */
const upsertSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  {
    elasticRoleName: () => schema.elasticRoleName,
    spaceId: () => schema.spaceId,
  },
);

/**
 * Schema to be applied when updating a space permission
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
