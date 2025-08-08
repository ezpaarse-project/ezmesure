const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
  requireFields,
} = require('./schema.utils');

/**
 * Base schema
 * @type {Record<string, import('joi').AnySchema>}
 */
const schema = {
  id: Joi.string().trim(),
  deletedAt: Joi.date(),
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  active: Joi.boolean(),
  activeUpdatedAt: Joi.date(),

  archivedUpdatedAt: Joi.date(),
  archived: Joi.boolean(),

  customerId: Joi.string().trim().allow('', null),
  requestorId: Joi.string().trim().allow('', null),
  apiKey: Joi.string().trim().allow('', null),
  comment: Joi.string().trim().allow('', null),

  packages: Joi.array().items(Joi.string()),
  tags: Joi.array().items(Joi.string()),

  institutionId: Joi.string().trim(),
  institution: Joi.object(),

  endpointId: Joi.string().trim(),
  endpoint: Joi.object(),

  params: Joi.array().items(Joi.object({
    name: Joi.string().trim(),
    value: Joi.string().trim(),
    scope: Joi.string().trim().lowercase(),
  })),

  harvests: Joi.array().items(Joi.object()),

  deletionTaskId: Joi.string().trim(),
  deletionTask: Joi.object(),

  connection: Joi.object({
    date: Joi.date(),
    status: Joi.string(),
    exceptions: Joi.array().items(Joi.object()),
    errorCode: Joi.string().allow('', null),
    counterVersion: Joi.string(),
  }),
};

/**
 * Fields that cannot be changed but could be found in request body
 */
const immutableFields = [
  'id',
  'deletedAt',
  'updatedAt',
  'archivedUpdatedAt',
  'activeUpdatedAt',
  'createdAt',
  'institution',
  'deletionTaskId',
  'deletionTask',
  'endpoint',
  'harvests',
  'connection',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'endpoint',
  'institution',
  'institution.memberships',
  'institution.memberships.user',
  'harvests',
  'deletionTask',
  'connection',
];

/**
 * Schema to be applied when a regular user creates SUSHI credentials
 */
const createSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  { connection: () => schema.connection },
  requireFields(['endpointId']),
);

/**
 * Schema to be applied when a regular user updates SUSHI credentials
 */
const updateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
);

/**
 * Schema to be applied when a regular user import multiple SUSHI credentials
 */
const importSchema = Joi.array().required().items({
  ...schema,
  id: schema.id,
});

module.exports = {
  schema,
  createSchema: Joi.object(createSchema).required(),
  updateSchema: Joi.object(updateSchema).required(),
  importSchema,
  includableFields,
};
