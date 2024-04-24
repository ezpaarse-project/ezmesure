// @ts-check

const { Joi } = require('koa-joi-router');

const {
  propsToPrismaInclude,
  propsToPrismaSort,
  stringOrArray,
  arrayOrString,
} = require('./utils');

/**
 * @typedef {import('joi').SchemaLike} JoiSchemaLike
 * @typedef {import('joi').AnySchema} JoiAnySchema
 * @typedef {import('joi').ObjectSchema} JoiObjectSchema
 *
 * @typedef {Object} JoiAndFilters
 * @prop {Record<string, JoiAnySchema>} validations
 * @prop {Record<string, (value: any) => any>} filters
 *
 * @typedef {Object} StandardQueryParams
 * @prop {JoiObjectSchema} manyValidation
 * @prop {(ctx: import('koa').Context) => Object} getPrismaManyQuery
 * @prop {JoiObjectSchema} oneValidation
 * @prop {(ctx: import('koa').Context) => Object} getPrismaOneQuery
 */

const stringOrArrayValidation = Joi.alternatives().try(
  Joi.string().trim().min(0),
  Joi.array().items(Joi.string().trim().min(1)).min(1),
);

const stringJoiAndFilter = (key) => ({
  validation: Joi.string().allow(''),
  filter: (value) => {
    if (!value) {
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

/**
 * Transform a DTO schema to a query validation to be used with Joi and
 * a method to get a Prisma query
 *
 * @param {Record<string, JoiAnySchema>} schema The DTO schema
 *
 * @returns {JoiAndFilters} The resulting Joi schema
 */
const prepareJoiAndFilters = (schema) => {
  /** @type {Record<string, any>} */
  const validations = {};
  /** @type {Record<string, any>} */
  const filters = {};

  // eslint-disable-next-line no-restricted-syntax, camelcase
  for (const [key, { type, $_terms: terms }] of Object.entries(schema)) {
    let validation;
    let filter;
    switch (type) {
      case 'string':
        ({ validation, filter } = stringJoiAndFilter(key));
        break;
      case 'boolean':
        ({ validation, filter } = booleanJoiAndFilter(key));
        break;
      case 'array':
        ({ validation, filter } = arrayJoiAndFilter(key, terms.items?.map((i) => i.type) ?? []));
        break;

      case 'number': {
        const { validation: fromV, filter: fromF } = numberJoiAndFilter(key, 'gte');
        const { validation: toV, filter: toF } = numberJoiAndFilter(key, 'lte');

        validations[`${key}:from`] = fromV;
        validations[`${key}:to`] = toV;

        filters[`${key}:from`] = fromF;
        filters[`${key}:to`] = toF;
        break;
      }

      case 'date': {
        const { validation: fromV, filter: fromF } = dateJoiAndFilter(key, 'gte');
        const { validation: toV, filter: toF } = dateJoiAndFilter(key, 'lte');

        validations[`${key}:from`] = fromV;
        validations[`${key}:to`] = toV;

        filters[`${key}:from`] = fromF;
        filters[`${key}:to`] = toF;
        break;
      }

      default:
        break;
    }

    if (validation) { validations[key] = validation; }
    if (filter) { filters[key] = filter; }
  }

  return {
    validations,
    filters,
  };
};

/**
 * Apply prisma filters from a query
 *
 * @param {import('koa').Context['query']} query Koa's query
 * @param {Record<string, (value: any) => any>} fieldsFilters Fields filters
 *
 * @returns {Record<string, any>} Prisma filter
 */
const applyPrismaFilters = (query, fieldsFilters) => {
  const filters = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(query)) {
    const filter = fieldsFilters[key]?.(value);
    if (filter) {
      filters.push(filter);
    }
  }

  if (filters.length > 0) {
    return { AND: filters };
  }
  return {};
};

/**
 * Prepare standard query validation to be used with Joi and a method to get a Prisma query with
 * predefined filters and pagination.
 *
 * @param {Object} dto The DTO
 * @param {Object} dto.schema The DTO schema
 * @param {string[]} [dto.includableFields] The fields that can be included in the query
 * @param {string[]} [dto.queryFields] The fields used to do a search
 *
 * @returns {StandardQueryParams} An object containing the validation and a method
 * to get a Prisma query
 */
const prepareStandardQueryParams = ({
  schema,
  includableFields,
  queryFields = ['name'],
}) => {
  const allowedIncludes = includableFields ? Joi.string().valid(...includableFields) : Joi.string();

  const baseValidation = Joi.object({
    include: Joi.array().single().items(allowedIncludes),
  }).rename('include[]', 'include');

  const paginationValidation = {
    size: Joi.number().min(0).default(10),
    page: Joi.number().min(1),
    sort: Joi.string(),
    order: Joi.string().valid('asc', 'desc'),
    distinct: stringOrArrayValidation,
    q: queryFields?.length > 0 ? Joi.string() : undefined,
  };

  const {
    validations: fieldsValidations,
    filters: fieldsFilters,
  } = prepareJoiAndFilters(schema);

  return {
    manyValidation: baseValidation.append(paginationValidation).append(fieldsValidations),
    getPrismaManyQuery: (ctx) => {
      const {
        sort,
        q: search,
        distinct: distinctFields,
        include: propsToInclude,
      } = ctx.query;

      const size = Number.parseInt(arrayOrString(ctx.query.size ?? '10'), 10);
      const page = Number.parseInt(arrayOrString(ctx.query.page ?? '1'), 10);
      const order = arrayOrString(ctx.query.order ?? 'asc');

      const query = {
        include: propsToPrismaInclude(stringOrArray(propsToInclude ?? ''), includableFields),
        orderBy: propsToPrismaSort(arrayOrString(sort ?? ''), order === 'asc' ? 'asc' : 'desc'),
        take: Number.isInteger(size) && size > 0 ? size : undefined,
        skip: Number.isInteger(size) ? size * (page - 1) : undefined,

        distinct: distinctFields && stringOrArray(distinctFields),

        where: applyPrismaFilters(ctx.query, fieldsFilters),
      };

      // Apply the search
      if (queryFields?.length > 0 && search) {
        query.where.OR = queryFields.map((field) => ({
          [field]: {
            contains: search,
            mode: 'insensitive',
          },
        }));
      }

      return query;
    },

    oneValidation: baseValidation,
    getPrismaOneQuery: (ctx) => {
      const { include: propsToInclude } = ctx.query;

      return {
        include: propsToPrismaInclude(stringOrArray(propsToInclude ?? ''), includableFields),
        where: {},
      };
    },
  };
};

module.exports = {
  stringOrArrayValidation,
  prepareStandardQueryParams,
};
