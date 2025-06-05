const { Joi } = require('koa-joi-router');

const {
  withModifiers,
  ignoreFields,
  requireFields,
  filterSchema,
} = require('./schema.utils');

/**
 * Base schema
 * @type {Record<string, import('joi').AnySchema>}
 */
const schema = {
  id: Joi.string().trim(),
  updatedAt: Joi.date(),
  createdAt: Joi.date(),

  active: Joi.boolean(),
  pattern: Joi.string().trim().min(1),
  target: Joi.string().trim().min(1),

  conditions: Joi.array().items(filterSchema).allow(null),
  filters: Joi.array().items(filterSchema).allow(null),

  repository: Joi.object(),
  aliases: Joi.array().items(Joi.object()),
};

/**
 * Fields that can be populated with related items
 */
const includableFields = [
  'repository',
  'aliases',
];

/**
 * Fields that cannot be changed but could be found in request body
 */
const immutableFields = [
  'id',
  'updatedAt',
  'createdAt',
  ...includableFields,
];

const mutableFields = Object.keys(schema).filter((field) => !immutableFields.includes(field));

/**
 * Schema to be applied when an administrator creates a repository alias
 */
const adminUpdateSingleFieldSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
);

/**
 * Schema to be applied when an administrator creates a repository alias
 */
const adminUpsertSchema = withModifiers(
  schema,
  ignoreFields(immutableFields),
  requireFields(['pattern', 'target']),
);

/**
 * Schema to be applied when an administrator imports multiple repository aliases
 */
const adminImportSchema = withModifiers(
  adminUpsertSchema,
  {
    id: () => schema.id,
    pattern: () => schema.pattern,
    repository: () => schema.repository,
    aliases: () => schema.aliases,
  },
);

module.exports = {
  schema,
  includableFields,
  immutableFields,
  mutableFields,
  adminUpdateSingleFieldSchema: Joi.object(adminUpdateSingleFieldSchema).required(),
  adminUpsertSchema: Joi.object(adminUpsertSchema).required(),
  adminImportSchema: Joi.object(adminImportSchema).required(),
};
