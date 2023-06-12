const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
  requireFields,
  withDefaults,
} = require('./schema.utils');

/**
 * Base schema
 * @type import('joi').SchemaLike
 */
const schema = {
  username: Joi.string().min(1),
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  fullName: Joi.string().allow(''),
  email: Joi.string().email(),
  isAdmin: Joi.boolean(),

  metadata: Joi.object(),

  memberships: Joi.array().items(Joi.object()),
  historyEntries: Joi.array().items(Joi.object()),
};

/**
 * Fields that cannot be changed but could be found in request body
 */
const immutableFields = [
  'username',
  'updatedAt',
  'createdAt',
  'memberships',
  'historyEntries',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'memberships',
  'memberships.institution',
  'historyEntries',
];

/**
 * Schema to be applied when an administrator creates a space
 */
const adminCreateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  requireFields(['fullName', 'email']),
  withDefaults({
    isAdmin: false,
    metadata: {},
  }),
);

/**
 * Schema to be applied when an administrator updates a space
 */
const adminUpdateSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
);

/**
 * Schema to be applied when an administrator imports multiple spaces
 */
const adminImportSchema = Joi.array().required().items(withModifiers(
  schema,
  requireFields(['username']),
));

module.exports = {
  schema,
  includableFields,
  adminCreateSchema: Joi.object(adminCreateSchema).required(),
  adminUpdateSchema: Joi.object(adminUpdateSchema).required(),
  adminImportSchema,
};
