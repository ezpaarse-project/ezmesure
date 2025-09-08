const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
  requireFields,
  withDefaults,
  nullMissing,
} = require('./schema.utils');

const roleIdPattern = /^[a-z0-9_-]+$/i;

/**
 * Base schema
 * @type {Record<string, import('joi').AnySchema>}
 */
const schema = {
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  id: Joi.string().trim().min(1).pattern(roleIdPattern),
  label: Joi.string().trim().min(1),
  description: Joi.string().trim().allow('').empty(null),
  icon: Joi.string().trim().allow('').empty(null),
  color: Joi.string().pattern(/^#([A-F0-9]{6})$/i).allow('').empty(null),
  restricted: Joi.boolean(),
  exposed: Joi.boolean(),

  permissionsPreset: Joi.object().allow(null),

  institutionId: Joi.string().allow(null),
  institution: Joi.object(),

  membershipRoles: Joi.array().items(Joi.object()),
};

/**
 * Fields that cannot be changed but could be found in request body
 */
const immutableFields = [
  'updatedAt',
  'createdAt',
  'institution',
  'membershipRoles',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'institution',
  'institution.memberships',
  'membershipRoles',
  'membershipRoles.membership',
  'membershipRoles.membership.user',
  'membershipRoles.membership.institution',
];

/**
 * Schema to be applied when an administrator upserts a role
 */
const adminUpsertSchema = withModifiers(
  schema,
  requireFields(['id', 'label']),
  ignoreFields(immutableFields),
  withDefaults({
    restricted: true,
    permissionsPreset: [],
  }),
  nullMissing(Object.keys(schema)),
);

/**
 * Schema to be applied when an administrator imports multiple roles
 */
const adminImportSchema = withModifiers(
  schema,
  requireFields(['id', 'label']),
);

module.exports = {
  schema,
  includableFields,
  adminUpsertSchema: Joi.object(adminUpsertSchema).required(),
  adminImportSchema: Joi.object(adminImportSchema).required(),
};
