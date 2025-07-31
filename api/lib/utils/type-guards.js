/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
module.exports.isObject = (value) => value
         && typeof value === 'object'
         && !Array.isArray(value);

module.exports.isFalse = (value) => value === false
  || ['false', 'off', 'no'].include(`${value}`.toLowerCase());

module.exports.isTrue = (value) => value === true
  || ['true', 'on', 'yes'].include(`${value}`.toLowerCase());
