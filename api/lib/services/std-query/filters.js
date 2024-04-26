// @ts-check

const { Joi } = require('koa-joi-router');

const { stringOrArray } = require('../utils');

const stringOrArrayValidation = Joi.alternatives().try(
  Joi.string().trim().min(0),
  Joi.array().items(Joi.string().trim().min(1)).min(1),
);

const stringJoiAndFilter = (key) => ({
  validation: stringOrArrayValidation,
  filter: (value) => {
    if (value?.length > 0) {
      return { [key]: { in: value } };
    }
    return { OR: [{ [key]: null }, { [key]: '' }] };
  },
});

const booleanJoiAndFilter = (key) => ({
  validation: Joi.boolean().allow(''),
  filter: (value) => {
    if (value) {
      return { [key]: value };
    }
    return { [key]: null };
  },
});

const arrayJoiAndFilter = (key, subtypes) => {
  // Preventing arrays of objects and arrays of arrays
  if (subtypes.includes('object') || subtypes.includes('array')) {
    return {};
  }

  return {
    validation: stringOrArrayValidation,
    filter: (value) => {
      const values = stringOrArray(value ?? '');
      if (values.length <= 0) {
        return { [key]: { isEmpty: true } };
      }
      return { [key]: { hasEvery: values } };
    },
  };
};

const dateJoiAndFilter = (key, operator) => ({
  validation: Joi.string().isoDate(),
  filter: (value) => ({ [key]: { [operator]: value } }),
});

const numberJoiAndFilter = (key, operator) => ({
  validation: Joi.number(),
  filter: dateJoiAndFilter(key, operator).filter,
});

module.exports = {
  stringOrArrayValidation,

  stringJoiAndFilter,
  booleanJoiAndFilter,
  arrayJoiAndFilter,
  dateJoiAndFilter,
  numberJoiAndFilter,
};
