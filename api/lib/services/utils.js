/**
 * Transforms a string as an array of string if needed.
 *
 * @param {string | string[]} value
 *
 * @returns {string[]} The resulting array
 */
const stringOrArray = (value) => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return value.split(',').map((s) => s.trim());
};

/**
 * Transforms an array of string as a string if needed.
 *
 * @param {string | string[]} value
 *
 * @returns {string} The resulting string
 */
const arrayOrString = (value) => {
  if (Array.isArray(value)) {
    return value.map((s) => s.trim()).join(',');
  }
  return value;
};

module.exports = {
  stringOrArray,
  arrayOrString,
};
