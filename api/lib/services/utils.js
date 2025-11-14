const { template, get, set } = require('lodash');

/**
 * @typedef {import('lodash').TemplateOptions} TemplateOptions
 */

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
 * @param {Object} [opts] - Options
 * @param {TemplateOptions} [opts.templateOptions] - Options to be passed to lodash.template()
 * @param {Set} [opts.toArray] - Paths that should be converted to array if
 *                               they contain multivalued interpolations
 *
 * @returns {Object} The resulting object
 */
const interpolateObject = (obj, context, opts, currentPath = []) => {
  if (Array.isArray(obj)) {
    return obj.map((item) => interpolateObject(item, context, opts, currentPath));
  }

  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(
        ([k, v]) => [k, interpolateObject(v, context, opts, [...currentPath, k])],
      ),
    );
  }

  if (typeof obj === 'string') {
    if (!opts?.toArray?.has(currentPath.join('.'))) {
      return interpolateString(obj, context, opts?.templateOptions);
    }

    const interpolatePattern = new RegExp(opts?.templateOptions?.interpolate ?? /{{(.+?)}}/, 'g');

    const multivaluedKeys = Array.from(obj.matchAll(interpolatePattern))
      .map((match) => match[1].trim())
      .filter((key) => Array.isArray(get(context, key)));

    if (multivaluedKeys.length === 0) {
      return interpolateString(obj, context, opts?.templateOptions);
    }

    // If there are multivalued interpolations, generate all possible combinations
    const combinations = multivaluedKeys.reduce((acc, key) => {
      const values = get(context, key);

      if (values.length === 0) { return acc; }

      return values.flatMap((value) => (
        acc.map((combination) => ({ ...combination, [key]: value }))
      ));
    }, [{}]);

    const ctx = JSON.parse(JSON.stringify(context));

    return combinations.map((combination) => {
      Object.entries(combination).forEach(([key, value]) => {
        set(ctx, key, value);
      });

      return interpolateString(obj, ctx, opts?.templateOptions);
    });
  }

  return obj;
};

module.exports = {
  stringToArray,
  arrayToString,
  interpolateString,
  interpolateObject,
};
