const { Joi } = require('koa-joi-router');

/**
 * Base schema
 * @type {import('joi').SchemaLike}
 */
const schema = {
  id: Joi.string().trim(),
  credentialsId: Joi.string().trim(),
  createdAt: Joi.date(),
  updatedAt: Joi.date(),
  startedAt: Joi.date(),
  status: Joi.string().trim(),
  reportType: Joi.string().trim(),
  sessionId: Joi.string().trim(),
  index: Joi.string().trim(),
  runningTime: Joi.number().integer(),
  result: Joi.object({
    errors: Joi.array(),
    failed: Joi.number().integer(),
    updated: Joi.number().integer(),
    inserted: Joi.number().integer(),
    coveredPeriods: Joi.array().items(Joi.string().regex(/^\d{4}-\d{2}$/)),
  }),
  errorCode: Joi.string().trim().allow(null),
  sushiExceptions: Joi.array().items(Joi.object({
    code: Joi.number().integer(),
    message: Joi.string().trim(),
    severity: Joi.string().trim(),
  })),

  credentials: Joi.object(),
  session: Joi.object(),
};

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'credentials',
  'credentials.institution',
  'credentials.endpoint',
  'session',
];

module.exports = {
  schema,
  includableFields,
};
