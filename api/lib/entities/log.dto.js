const { Joi } = require('koa-joi-router');

/**
 * Base schema
 * @type {Record<string, import('joi').AnySchema>}
 */
const schema = {
  id: Joi.string().trim(),
  jobId: Joi.string().trim(),
  date: Joi.date(),
  level: Joi.string().trim(),
  message: Joi.string().trim(),

  job: Joi.object(),
};

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'job',
  'job.credentials',
  'job.credentials.institution',
  'job.credentials.endpoint',
];

module.exports = {
  schema,
  includableFields,
};
