const { template } = require('lodash');

/**
 * Transforms a string as an array of string if needed.
 *
 * @param {string | string[]} value
 * @param {string} separator
 *
 * @returns {string[]} The resulting array
 */
const stringToArray = (value, separator = ',') => {
  if (Array.isArray(value)) {
    return value;
  }
  if (!value || typeof value !== 'string') {
    return [];
  }
  return value.split(separator).map((s) => s.trim());
};

/**
 * Transforms an array of string as a string if needed.
 *
 * @param {string | string[]} value
 * @param {string} separator
 *
 * @returns {string} The resulting string
 */
const arrayToString = (value, separator = ',') => {
  if (Array.isArray(value)) {
    return value.map((s) => s.trim?.()).join(separator);
  }
  return value;
};

/**
 * Interpolate a string with a given context.
 * @example interpolateString('Hello {{name}}', { name: 'world' })
 *
 * @param {string} str - The string to be interpolated
 * @param {Object} context - The context available for interpolation
 * @param {Object} [opts] - Options to be passed to lodash.template()
 *
 * @returns {string} The resulting string
 */
const interpolateString = (str, context, opts = {}) => (
  template(str, { interpolate: /{{(.+?)}}/, ...opts })(context)
);

/**
 * Recursively interpolate string values in an object, with a given context.
 * @example interpolateObject({ greet: 'Hello {{name}}' }, { name: 'world' })
 *
 * @param {Object} obj - The object to be interpolated
 * @param {Object} context - The context available for interpolation
 * @param {Object} [opts] - Options to be passed to lodash.template()
 *
 * @returns {Object} The resulting object
 */
const interpolateObject = (obj, context, opts) => {
  if (Array.isArray(obj)) {
    return obj.map((item) => interpolateObject(item, context, opts));
  }

  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, interpolateObject(v, context, opts)]),
    );
  }

  if (typeof obj === 'string') {
    return interpolateString(obj, context, opts);
  }

  return obj;
};

module.exports = {
  stringToArray,
  arrayToString,
  interpolateString,
  interpolateObject,
};
