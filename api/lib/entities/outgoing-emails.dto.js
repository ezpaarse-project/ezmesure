const { Joi } = require('koa-joi-router');

/**
 * Base schema
 * @type {Record<string, import('joi').AnySchema>}
 */
const schema = {
  id: Joi.string().trim(),
  sentAt: Joi.date(),

  recipients: Joi.array().items(Joi.string().trim().email()),

  status: Joi.string().trim(),
  subject: Joi.string().allow(''),
  locale: Joi.string().trim(),
  template: Joi.string().trim(),
  errors: Joi.array().items(Joi.string().trim()),
};

/**
 * Fields that cannot be changed but could be found in a request body
 */
const immutableFields = [
  'id',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [];

module.exports = {
  schema,
  allFields: Object.keys(schema),
  immutableFields,
  includableFields,
};
