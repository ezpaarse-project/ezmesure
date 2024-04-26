const { Joi } = require('koa-joi-router');

/**
 * Base schema
 * @type {import('joi').SchemaLike}
 */
const schema = {
  harvestedAt: Joi.date(),
  credentialsId: Joi.string().trim(),
  reportId: Joi.string().trim(),
  period: Joi.string().regex(/^\d{4}-\d{2}$/),
  status: Joi.string().trim(),
  errorCode: Joi.string().trim(),
  insertedItems: Joi.number().integer(),
  updatedItems: Joi.number().integer(),
  failedItems: Joi.number().integer(),

  sushiExceptions: Joi.array().items(Joi.object({
    code: Joi.number().integer(),
    message: Joi.string().trim(),
    severity: Joi.string().trim(),
  })),

  credentials: Joi.array().items(Joi.object()),
};

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'credentials',
  'credentials.institution',
  'credentials.endpoint',
];

module.exports = {
  schema,
  includableFields,
};
