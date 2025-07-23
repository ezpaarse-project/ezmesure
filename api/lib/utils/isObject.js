/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
const isObject = (value) => value
         && typeof value === 'object'
         && !Array.isArray(value);

module.exports = isObject;
