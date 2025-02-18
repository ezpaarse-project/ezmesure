const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
} = require('./schema.utils');

/**
 * Base schema
 * @type {import('joi').SchemaLike}
 */
const schema = {
  elasticRoleName: Joi.string().trim(),
  repositoryPattern: Joi.string().trim(),

  elasticRole: Joi.object(),
  repository: Joi.object(),

  readonly: Joi.boolean(),
};

/**
 * Fields that cannot be changed but could be found in a request body
 */
const immutableFields = [
  'elasticRoleName',
  'elasticRole',
  'repositoryPattern',
  'repository',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'elasticRole',
  'repository',
];

/**
 * Schema to be applied when creating a new repository permission
 */
const createSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  {
    elasticRoleName: () => schema.elasticRoleName,
    repositoryPattern: () => schema.repositoryPattern,
  },
);

/**
 * Schema to be applied when creating or updating a new repository permission
 */
const upsertSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  {
    elasticRoleName: () => schema.elasticRoleName,
    repositoryPattern: () => schema.repositoryPattern,
  },
);

/**
 * Schema to be applied when updating a repository permission
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
