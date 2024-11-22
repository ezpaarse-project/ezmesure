const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
  requireFields,
  nullMissing,
  withDefaults,
} = require('./schema.utils');

/**
 * Base schema
 * @type {import('joi').SchemaLike}
 */
const schema = {
  id: Joi.string().trim().min(1).pattern(/^[a-zA-Z0-9_-]+$/),

  createdAt: Joi.date(),
  updatedAt: Joi.date(),

  editable: Joi.boolean(),
  visible: Joi.boolean(),
  multiple: Joi.boolean(),

  labelFr: Joi.string().allow('').empty(null),
  labelEn: Joi.string().allow('').empty(null),
  descriptionFr: Joi.string().allow('').empty(null),
  descriptionEn: Joi.string().allow('').empty(null),

  helpUrl: Joi.string().trim().empty(null),
  itemUrl: Joi.string().trim().empty(null),

  autocomplete: Joi.object().empty(null),
  institutionProperties: Joi.object(),
};

/**
 * Fields that cannot be changed but could be found in request body
 */
const immutableFields = [
  'id',
  'institutionProperties',
  'createdAt',
  'updatedAt',
];

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'institutionProperties',
];

/**
 * Schema to be applied when an administrator updates a field
 */
const adminUpsertSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  withDefaults({
    multiple: false,
    editable: false,
    visible: false,
  }),
  nullMissing(Object.keys(schema)),
);

/**
 * Schema to be applied when an administrator imports multiple fields
 */
const adminImportSchema = withModifiers(
  schema,
  requireFields(['id']),
);

module.exports = {
  schema,
  includableFields,
  adminUpsertSchema: Joi.object(adminUpsertSchema).required(),
  adminImportSchema: Joi.object(adminImportSchema).required(),
};
