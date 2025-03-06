// @ts-check

const { Joi } = require('koa-joi-router');

const { stringToArray } = require('../utils');

/**
 * @typedef {((value: any) => object) | undefined} PreparePrismaFilter
 * @typedef {{ validation: any | undefined, filter: PreparePrismaFilter }} ValidationAndFilter
 */

// Joi validation for supporting both an array and a string
const stringOrArrayValidation = Joi.alternatives().try(
  Joi.string().trim().min(0),
  Joi.array().items(Joi.string().trim().min(1)).min(1),
);

/**
 * Prepare Joi validation and filter for a string
 *
 * @param {string} key The name of the field
 * @param {RegExp} [regex] The regex for the validation
 *
 * @returns {ValidationAndFilter} The validation and filter
 */
const stringJoiAndFilter = (key, regex = undefined) => {
  let strValidation = Joi.string().trim();
  if (regex) {
    strValidation = strValidation.regex(regex);
  }

  return {
    validation: Joi.alternatives().try(
      strValidation.min(0),
      Joi.array().items(strValidation.min(1)).min(1),
    ),
    filter: (value) => {
      const values = stringToArray(value ?? '');
      if (values.length > 0) {
        return { [key]: { in: values } };
      }
      return { OR: [{ [key]: null }, { [key]: '' }] };
    },
  };
};

/**
 * Prepare Prisma filter for a boolean
 *
 * @param {string | undefined} value Value of the query parameter
 * @param {boolean} [isNullable] Is field nullable
 */
const booleanFilter = (value, isNullable) => {
  if (value == null) {
    return undefined;
  }
  if (isNullable && typeof value !== 'boolean') {
    return null;
  }
  return value;
};

/**
 * Prepare Joi validation and filter for a boolean
 *
 * @param {string} key The name of the field
 * @param {boolean} [isNullable] Is field nullable
 *
 * @returns {ValidationAndFilter} The validation and filter
 */
const booleanJoiAndFilter = (key, isNullable) => {
  let validation = Joi.boolean();
  if (isNullable) {
    validation = validation.allow('');
  }

  return {
    validation,
    filter: (value) => ({ [key]: booleanFilter(value, isNullable) }),
  };
};

/**
 * Prepare Prisma filter for a array
 *
 * @param {string | string[] | undefined} value Value of the query parameter
 */
const arrayFilter = (value) => {
  if (value == null) {
    return undefined;
  }

  const values = stringToArray(value ?? '');
  if (values.length <= 0) {
    return { isEmpty: true };
  }
  return { hasEvery: values };
};

/**
 * Prepare Joi validation and filter for a array
 *
 * Arrays of objects and arrays of arrays are not supported
 *
 * @param {string} key The name of the field
 * @param {string[]} [subtypes] Subtypes of the array
 *
 * @returns {ValidationAndFilter} The validation and filter
 */
const arrayJoiAndFilter = (key, subtypes) => {
  if (subtypes?.includes('object') || subtypes?.includes('array')) {
    return {
      validation: undefined,
      filter: undefined,
    };
  }

  return {
    validation: stringOrArrayValidation,
    filter: (value) => ({ [key]: arrayFilter(value) }),
  };
};

/**
 * Prepare Prisma filter for a date
 *
 * @param {string | undefined} value Value of the query parameter
 * @param {'gte' | 'gt' | 'eq' | 'lte' | 'lt'} operator The operator
 * @param {boolean} [isNullable] Is field nullable
 */
const dateFilter = (value, operator, isNullable) => {
  if (value == null) {
    return undefined;
  }
  if (isNullable && !value) {
    return null;
  }
  return { [operator]: value };
};

/**
 * Prepare Joi validation and filter for a date
 *
 * @param {string} key The name of the field
 * @param {'gte' | 'gt' | 'eq' | 'lte' | 'lt'} operator The operator
 * @param {boolean} [isNullable] Is field nullable
 *
 * @returns {ValidationAndFilter} The validation and filter
 */
const dateJoiAndFilter = (key, operator, isNullable) => {
  let validation = Joi.string().isoDate();
  if (isNullable) {
    validation = validation.allow('');
  }

  return {
    validation,
    filter: (value) => ({ [key]: dateFilter(value, operator, isNullable) }),
  };
};

/**
 * Prepare Prisma filter for a number
 *
 * @param {number | undefined} value Value of the query parameter
 * @param {'gte' | 'gt' | 'eq' | 'lte' | 'lt'} operator The operator
 * @param {boolean} [isNullable] Is field nullable
 */
const numberFilter = (value, operator, isNullable) => {
  if (value == null) {
    return undefined;
  }
  if (isNullable && typeof value !== 'number') {
    return null;
  }
  return { [operator]: value };
};

/**
 * Prepare Joi validation and filter for a number
 *
 * @param {string} key The name of the field
 * @param {'gte' | 'gt' | 'eq' | 'lte' | 'lt'} operator The operator
 * @param {boolean} [isNullable] Is field nullable
 *
 * @returns {ValidationAndFilter} The validation and filter
 */
const numberJoiAndFilter = (key, operator, isNullable) => {
  let validation = Joi.number();
  if (isNullable) {
    validation = validation.allow('');
  }

  return {
    validation,
    filter: (value) => ({ [key]: numberFilter(value, operator, isNullable) }),
  };
};

module.exports = {
  stringOrArrayValidation,

  stringJoiAndFilter,
  booleanFilter,
  booleanJoiAndFilter,
  arrayFilter,
  arrayJoiAndFilter,
  dateFilter,
  dateJoiAndFilter,
  numberFilter,
  numberJoiAndFilter,
};
