// @ts-check

const { Joi } = require('koa-joi-router');

const { stringOrArray } = require('../utils');

const stringOrArrayValidation = Joi.alternatives().try(
  Joi.string().trim().min(0),
  Joi.array().items(Joi.string().trim().min(1)).min(1),
);

const stringJoiAndFilter = (key) => ({
  validation: Joi.string().allow(''),
  filter: (value) => {
    if (value) {
      return { [key]: value };
    }
    return { OR: [{ [key]: null }, { [key]: '' }] };
  },
});

const booleanJoiAndFilter = (key) => ({
  validation: Joi.boolean().allow(''),
  filter: stringJoiAndFilter(key).filter,
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
