// @ts-check

const { Joi } = require('koa-joi-router');

const { arrayOrString, stringOrArray } = require('../utils');

const {
  stringOrArrayValidation,

  stringJoiAndFilter,
  booleanJoiAndFilter,
  arrayJoiAndFilter,
  numberJoiAndFilter,
  dateJoiAndFilter,
} = require('./filters');
const { propsToPrismaInclude, propsToPrismaSort } = require('./prisma-query');

/**
 * @typedef {import('joi').SchemaLike} JoiSchemaLike
 * @typedef {import('joi').AnySchema} JoiAnySchema
 * @typedef {import('joi').ObjectSchema} JoiObjectSchema
 *
 * @typedef {object} JoiAndFilters
 * @prop {JoiObjectSchema} validations
 * @prop {Record<string, (value: any) => any>} filters
 *
 * @typedef {object} StandardQueryParams
 * @prop {JoiObjectSchema} manyValidation
 * @prop {(ctx: import('koa').Context) => object} getPrismaManyQuery
 * @prop {JoiObjectSchema} oneValidation
 * @prop {(ctx: import('koa').Context, where: object) => object} getPrismaOneQuery
 */

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
  const arrayFields = [];

  // eslint-disable-next-line no-restricted-syntax, camelcase
  for (const [key, { type, $_terms: terms }] of Object.entries(schema)) {
    let validation;
    let filter;
    switch (type) {
      case 'string':
        ({ validation, filter } = stringJoiAndFilter(key));
        arrayFields.push(key);
        break;
      case 'boolean':
        ({ validation, filter } = booleanJoiAndFilter(key));
        break;
      case 'array':
        ({ validation, filter } = arrayJoiAndFilter(key, terms.items?.map((i) => i.type) ?? []));
        arrayFields.push(key);
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

    if (validation) {
      validations[key] = validation;
    }
    if (filter) {
      filters[key] = filter;
    }
  }

  let joiValidation = Joi.object(validations);
  // eslint-disable-next-line no-restricted-syntax
  for (const key of arrayFields) {
    joiValidation = joiValidation.rename(`${key}[]`, key);
  }

  return {
    validations: joiValidation,
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
 * Apply prisma search
 *
 * @param {string[]} queryFields Fields to search
 * @param {string} search The search
 *
 * @returns {Record<string, any>} Prisma search
 */
const applyPrismaSearch = (queryFields, search) => ({
  OR: queryFields.map((field) => ({
    [field]: {
      contains: search,
      mode: 'insensitive',
    },
  })),
});

/**
 * Prepare standard query validation to be used with Joi and a method to get a Prisma query with
 * predefined filters and pagination.
 *
 * @param {Object} dto The DTO
 * @param {Object} dto.schema The DTO schema
 * @param {string[]} [dto.includableFields] The fields that can be included in the query
 * @param {string[]} [dto.sourcableFields] The fields that can be sourced in the query
 * @param {string[]} [dto.queryFields] The fields used to do a search
 *
 * @returns {StandardQueryParams} An object containing the validation and a method
 * to get a Prisma query
 */
const prepareStandardQueryParams = ({
  schema,
  includableFields = undefined,
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
  };
  if (queryFields?.length > 0) {
    paginationValidation.q = Joi.string().trim();
  }

  const {
    validations: fieldsValidations,
    filters: fieldsFilters,
  } = prepareJoiAndFilters(schema);

  return {
    manyValidation: baseValidation.append(paginationValidation).concat(fieldsValidations),
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
        query.where = {
          ...query.where,
          ...applyPrismaSearch(queryFields, arrayOrString(search)),
        };
      }

      return query;
    },

    oneValidation: baseValidation,
    getPrismaOneQuery: (ctx, where = {}) => {
      const { include: propsToInclude } = ctx.query;

      return {
        include: propsToPrismaInclude(stringOrArray(propsToInclude ?? ''), includableFields),
        where,
      };
    },
  };
};

module.exports = {
  stringOrArrayValidation,
  prepareStandardQueryParams,
};
