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
  id: Joi.string().trim(),
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  beginDate: Joi.string().regex(/^\d{4}-\d{2}$/),
  endDate: Joi.string().regex(/^\d{4}-\d{2}$/),
  reportTypes: Joi.array().items(Joi.string()),
  timeout: Joi.number(),
  allowFaulty: Joi.boolean(),
  downloadUnsupported: Joi.boolean(),
  forceDownload: Joi.boolean(),
  ignoreValidation: Joi.boolean().allow(null),
  params: Joi.object().pattern(Joi.string(), Joi.any()),

  credentials: Joi.array().items(Joi.object()),
  jobs: Joi.array().items(Joi.object()),

  institutions: Joi.array().items(Joi.object()),
};

/**
 * Fields that cannot be changed by regular users
 */
const adminFields = [];

/**
 * Fields that cannot be changed but could be found in a request body
 */
const immutableFields = [
  'id',
  'updatedAt',
  'createdAt',
  'jobs',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'credentials',
  'credentials.institution',
  'credentials.endpoint',
  'jobs',
  'jobs.credentials',
  'jobs.credentials.institution',
  'jobs.credentials.endpoint',
];

/**
 * Schema to be applied when an administrator creates an harvest sessions
 */
const adminCreateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  requireFields(['beginDate', 'endDate', 'reportTypes']),
  withDefaults({
    timeout: 600,
    allowFaulty: false,
    downloadUnsupported: false,
    forceDownload: false,
    ignoreValidation: null,
    params: {},
  }),
);

/**
 * Schema to be applied when an administrator updates an harvest sessions
 */
const adminUpdateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
);

module.exports = {
  schema,
  adminFields,
  immutableFields,
  includableFields,
  adminCreateSchema: Joi.object(adminCreateSchema).required(),
  adminUpdateSchema: Joi.object(adminUpdateSchema).required(),
};
