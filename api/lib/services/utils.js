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

module.exports = {
  stringToArray,
  arrayToString,
};
