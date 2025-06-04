const InstitutionsService = require('../entities/institutions.service');
const { getPrismaManyQuery } = require('../controllers/institutions/actions').standardQueryParams;

/* eslint-disable max-len */
/**
 * @typedef {import('@prisma/client').Prisma.InstitutionPropertyWhereInput} InstitutionPropertyWhereInput
 * @typedef {import('@prisma/client').Prisma.JsonValue} JsonValue
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
  if (!value) {
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

/**
 * Get institutions matching given conditions
 * @param {Filter[]|JsonValue[]} conditions
 * @returns {Promise<Institution[]>}
 */
const getInstitutionsMatchingConditions = async (conditions) => {
  /** @type {InstitutionWhereInput[]} */
  const propsFilters = [];
  /** @type {KoaQuery} */
  const query = {};
  /** @type {KoaQuery} */
  const notQuery = {};

  conditions.forEach((condition) => {
    if (!isFilter(condition)) { return; }

    const { field, value, isNot } = condition;

    if (condition.field.startsWith('customProps.')) {
      propsFilters.push({
        customProps: {
          [isNot ? 'none' : 'some']: customPropFilter(field.slice(12), value),
        },
      });
    } else if (isNot) {
      notQuery[field] = value;
    } else {
      query[field] = value;
    }
  });

  /** @type {InstitutionWhereInput} */
  const institutionsQuery = getPrismaManyQuery({ query: { ...query } })?.where;
  /** @type {InstitutionWhereInput} */
  const institutionsNotQuery = getPrismaManyQuery({ query: { ...notQuery } })?.where;

  if (!Array.isArray(institutionsQuery.AND)) {
    institutionsQuery.AND = institutionsQuery.AND ? [institutionsQuery.AND] : [];
  }

  if (propsFilters.length > 0) {
    institutionsQuery.AND = [
      ...institutionsQuery.AND,
      ...propsFilters,
      { NOT: institutionsNotQuery.AND },
    ];
  }

  /** @type {InstitutionWithProps[]} */
  let institutions = [];

  if (Object.keys(institutionsQuery).length > 0) {
    const institutionsService = new InstitutionsService();

    // @ts-ignore
    institutions = await institutionsService.findMany({
      where: institutionsQuery,
      include: { customProps: true },
    });
  }

  return institutions;
};

module.exports = {
  isFilter,
  customPropFilter,
  getInstitutionsMatchingConditions,
};
