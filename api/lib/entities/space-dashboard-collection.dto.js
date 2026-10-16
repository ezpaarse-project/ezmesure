const { Joi } = require('koa-joi-router');

/**
 * Base schema
 * @type {Record<string, import('joi').AnySchema>}
 */
const schema = {
  collectionId: Joi.string().trim(),
  spaceId: Joi.string().trim(),
  repositoryPattern: Joi.string().trim(),

  collection: Joi.object(),
  space: Joi.object(),
  repository: Joi.object(),

  disabledDashboards: Joi.array().items(Joi.string().trim()),
  importedAt: Joi.date(),
  importErrors: Joi.array().items(Joi.object()),
};

/**
 * Fields that cannot be changed but could be found in a request body
 */
const immutableFields = [
  'collectionId',
  'spaceId',
  'repositoryPattern',
  'collection',
  'space',
  'repository',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'collection',
  'space',
  'repository',
];

module.exports = {
  schema,
  allFields: Object.keys(schema),
  immutableFields,
  includableFields,
};
