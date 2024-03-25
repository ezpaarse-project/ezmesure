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
  username: Joi.string().trim(),
  institutionId: Joi.string().trim(),
  membership: Joi.object(),

  spaceId: Joi.string().trim(),
  space: Joi.object(),

  readonly: Joi.boolean(),
  locked: Joi.boolean(),
};

/**
 * Fields that cannot be changed but could be found in a request body
 */
const immutableFields = [
  'username',
  'institutionId',
  'membership',
  'spaceId',
  'space',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'membership',
  'space',
];

/**
 * Schema to be applied when creating a new space permission
 */
const upsertSchema = withModifiers(
  schema,
  requireFields(['username', 'spaceId', 'institutionId']),
  ignoreFields(immutableFields),
  withDefaults({
    readonly: false,
    locked: false,
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
  updateSchema: Joi.object(updateSchema).required(),
  upsertSchema: Joi.object(upsertSchema).required(),
};
