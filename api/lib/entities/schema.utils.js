const { Joi } = require('koa-joi-router');

/** @typedef {import('joi').SchemaLike} SchemaLike */

/**
 * A modifier function that takes a Joi schema and returns a new one
 * @callback modifierCallback
 * @param {SchemaLike} schema  the schema to modify
 * @returns {SchemaLike}  the resulting schema
 */

/**
 * An object that associate field names to schema modifiers
 * @typedef {Object.<string, modifierCallback>} Modifier
 */

/**
 * Returns a new schema with modifiers applied to given fields
 * @param {SchemaLike} schema  a Joi schema
 * @param {...Modifier} modifiers  a list of modifiers to be applied to the schema
 * @returns {SchemaLike}  the modified schema
 */
exports.withModifiers = function withModifiers(schema = {}, ...modifiers) {
  return modifiers.reduce((acc, modifier) => (
    Object.fromEntries(
      Object.entries(acc).map(([field, fieldSchema]) => ([
        field,
        modifier?.[field]?.(fieldSchema) || fieldSchema,
      ])),
    )
  ), schema);
};

/**
 * Creates a schema modifier that ignores a list of fields
 * @param {string[]} fields  fields to ignore
 * @returns {Modifier} the modifier
 */
exports.ignoreFields = function ignoreFields(fields = []) {
  return Object.fromEntries(
    fields.map((field) => [field, () => Joi.any().strip()]),
  );
};

/**
 * Creates a schema modifier that makes a list of fields required
 * @param {string[]} fields  fields to require
 * @returns {Modifier} the modifier
 */
exports.requireFields = function requireFields(fields = []) {
  return Object.fromEntries(
    fields.map((field) => [field, (schema) => schema.required()]),
  );
};

/**
 * Creates a schema modifier that defaults to null for a list of fields (if no default is set)
 * @param {string[]} fields  fields that should default to null
 * @returns {Modifier} the modifier
 */
exports.nullMissing = function nullMissing(fields = []) {
  return Object.fromEntries(
    fields.map(
      (field) => [
        field,
        (schema) => {
          const flags = schema.describe()?.flags || {};
          return 'default' in flags ? schema : schema.default(null);
        },
      ],
    ),
  );
};

/**
 * Creates a schema modifier that set default values for a list of fields
 * @param {Object} defaults  an object associating field names to default values
 * @returns {Modifier} the modifier
 */
exports.withDefaults = function withDefaults(defaults = {}) {
  return Object.fromEntries(
    Object.entries(defaults).map(
      ([field, defaultValue]) => [field, (schema) => schema.default(defaultValue)],
    ),
  );
};

exports.filtersSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  field: Joi.string().trim().min(1).required(),
  isNot: Joi.boolean().default(false),
  value: Joi.alternatives([
    // Null values are allowed to check if empty
    Joi.string().trim().min(1), // Exact match
    Joi.array().items(Joi.string().trim().min(1)), // One of
  ]).allow(null),
});
