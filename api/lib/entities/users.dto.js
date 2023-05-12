const { Joi } = require('koa-joi-router');

/**
 * Fields that can be changed by regular users
 */
const regularFields = {};

/**
 * Fields that cannot be changed by regular users
 */
const restrictedFields = {
  username: Joi.string().min(1),
  fullName: Joi.string().allow(''),
  email: Joi.string().email(),
  isAdmin: Joi.boolean(),
  metadata: Joi.object(),
};

/**
 * Fields that can be changed by admins
 */
const requiredFields = {
  fullName: restrictedFields.fullName.required(),
  email: restrictedFields.email.required(),
};

/**
 * Fields that cannot be changed but could be found in a request body
 */
const immutableFields = Object.fromEntries(
  [
    'username',
    'updatedAt',
    'createdAt',
    'memberships',
    'historyEntries',
  ].map(
    (field) => [field, Joi.any().strip()],
  ),
);

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'memberships',
  'memberships.institution',
  'historyEntries',
];

/**
 * Schema to be applied when an administrator creates a user
 */
const adminCreateSchema = {
  ...regularFields,
  ...restrictedFields,
  ...requiredFields,
  ...immutableFields,

  isAdmin: restrictedFields.isAdmin.default(false),
  metadata: restrictedFields.metadata.default({}),
};

/**
 * Schema to be applied when an administrator updates a user
 */
const adminUpdateSchema = {
  ...regularFields,
  ...restrictedFields,
  ...immutableFields,
};

module.exports = {
  adminCreateSchema: Joi.object(adminCreateSchema).required(),
  adminUpdateSchema: Joi.object(adminUpdateSchema).required(),
  includableFields,
};
