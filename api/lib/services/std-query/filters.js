// @ts-check

const { Joi } = require('koa-joi-router');

const { stringToArray } = require('../utils');

const stringOrArrayValidation = Joi.alternatives().try(
  Joi.string().trim().min(0),
  Joi.array().items(Joi.string().trim().min(1)).min(1),
);

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

const booleanJoiAndFilter = (key, isNullable) => {
  let validation = Joi.boolean();
  if (isNullable) {
    validation = validation.allow('');
  }

  return {
    validation,
    filter: (value) => {
      if (isNullable && typeof value !== 'boolean') {
        return { [key]: null };
      }
      return { [key]: value };
    },
  };
};

const arrayJoiAndFilter = (key, subtypes) => {
  // Preventing arrays of objects and arrays of arrays
  if (subtypes.includes('object') || subtypes.includes('array')) {
    return {};
  }

  return {
    validation: stringOrArrayValidation,
    filter: (value) => {
      const values = stringToArray(value ?? '');
      if (values.length <= 0) {
        return { [key]: { isEmpty: true } };
      }
      return { [key]: { hasEvery: values } };
    },
  };
};

const dateJoiAndFilter = (key, isNullable, operator) => {
  let validation = Joi.string().isoDate();
  if (isNullable) {
    validation = validation.allow('');
  }

  return {
    validation,
    filter: (value) => {
      if (isNullable && value === '') {
        return { [key]: null };
      }
      return { [key]: { [operator]: value } };
    },
  };
};

const numberJoiAndFilter = (key, isNullable, operator) => {
  let validation = Joi.number();
  if (isNullable) {
    validation = validation.allow('');
  }

  return {
    validation,
    filter: (value) => {
      if (isNullable && typeof value !== 'number') {
        return { [key]: null };
      }
      return { [key]: { [operator]: value } };
    },
  };
};

module.exports = {
  stringOrArrayValidation,

  stringJoiAndFilter,
  booleanJoiAndFilter,
  arrayJoiAndFilter,
  dateJoiAndFilter,
  numberJoiAndFilter,
};
