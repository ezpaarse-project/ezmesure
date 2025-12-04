/* eslint-disable max-len */
/**
 * @typedef {import('../.prisma/client.mts').Prisma.InstitutionPropertyWhereInput} InstitutionPropertyWhereInput
 * @typedef {import('../.prisma/client.mts').Prisma.JsonValue} JsonValue
 * @typedef {import('koa').Context['query']} KoaQuery
 *
 * @typedef {object} Filter
 * @property {string} field
 * @property {boolean} isNot
 * @property {string} [value]
*/
/* eslint-enable max-len */

/**
 * Check that an object is a filter
 * @param {any} obj
 * @returns {obj is Filter}
 */
const isFilter = (obj) => {
  if (!obj) { return false; }
  if (typeof obj !== 'object') { return false; }
  if (!('field' in obj)) { return false; }
  if (typeof obj.field !== 'string') { return false; }
  return true;
};

/**
 * Create a customProp filter based on a field ID and a value
 * @param {string} fieldId ID of the custom field
 * @param {string|string[]} [value] Condition value
 * @returns {InstitutionPropertyWhereInput}
 */
const customPropFilter = (fieldId, value) => {
  if (value == null) {
    return { fieldId };
  }

  const values = Array.isArray(value) ? value : [value];

  return {
    AND: [
      { fieldId },
      {
        OR: values.flatMap((v) => [
          { value: { equals: v } },
          { value: { array_contains: [v] } },
        ]),
      },
    ],
  };
};

module.exports = {
  isFilter,
  customPropFilter,
};
