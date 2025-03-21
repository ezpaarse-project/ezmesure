// @ts-check

const { Joi } = require('koa-joi-router');

const { arrayToString, stringToArray } = require('../utils');

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
 * @typedef {import('koa').Context} KoaContext
 * @typedef {import('koa').Context['query']} KoaQuery
 *
 * @typedef {object} JoiAndFilters
 * @prop {JoiObjectSchema} validations
 * @prop {Record<string, (value: any) => any>} filters
 *
 * @typedef {object} StandardQueryParams
 * @prop {JoiObjectSchema} manyValidation
 * @prop {(ctx: KoaContext) => object} getPrismaManyQuery
 * @prop {JoiObjectSchema} oneValidation
 * @prop {(ctx: KoaContext, where: object) => object} getPrismaOneQuery
 */

/**
 * Transform a DTO schema to a query validation to be used with Joi and
 * methods to get a Prisma filters
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

  // eslint-disable-next-line no-restricted-syntax
  for (const [key, def] of Object.entries(schema)) {
    /* eslint-disable no-underscore-dangle */
    // @ts-ignore
    const isNullable = def._valids?.has?.(null) || false;
    // @ts-ignore
    const regex = def._rules.find((r) => r.name === 'pattern')?.args?.regex;
    /* eslint-enable no-underscore-dangle */

    let validation;
    let filter;
    switch (def.type) {
      case 'string':
        ({ validation, filter } = stringJoiAndFilter(key, regex));
        arrayFields.push(key);
        break;
      case 'boolean':
        ({ validation, filter } = booleanJoiAndFilter(key, isNullable));
        break;
      case 'array': {
        const subtypes = def.$_terms.items?.map((i) => i.type) ?? [];

        ({ validation, filter } = arrayJoiAndFilter(key, subtypes));

        validations[`${key}:loose`] = Joi.boolean().default(false);
        // filter for ${key}:loose will be handled in arrayJoiAndFilter

        arrayFields.push(key);
        break;
      }

      case 'number': {
        const { validation: fromV, filter: fromF } = numberJoiAndFilter(key, 'gte', isNullable);
        const { validation: toV, filter: toF } = numberJoiAndFilter(key, 'lte', isNullable);

        validations[`${key}:from`] = fromV;
        validations[`${key}:to`] = toV;

        filters[`${key}:from`] = fromF;
        filters[`${key}:to`] = toF;
        break;
      }

      case 'date': {
        const { validation: fromV, filter: fromF } = dateJoiAndFilter(key, 'gte', isNullable);
        const { validation: toV, filter: toF } = dateJoiAndFilter(key, 'lte', isNullable);

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
 * @param {KoaQuery} query Koa's query
 * @param {Record<string, (value: any, query: KoaQuery) => any>} fieldsFilters Fields filters
 *
 * @returns {Record<string, any>} Prisma filter
 */
const applyPrismaFilters = (query, fieldsFilters) => {
  const filters = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(query)) {
    const filter = fieldsFilters[key]?.(value, query);
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

  const {
    validations: fieldsValidations,
    filters: fieldsFilters,
  } = prepareJoiAndFilters(schema);

  const paginationValidation = {
    size: Joi.number().min(0).default(10),
    page: Joi.number().min(1),
    sort: stringOrArrayValidation,
    order: Joi.alternatives().try(
      Joi.string().valid('asc', 'desc'),
      Joi.array().items(Joi.string().valid('asc', 'desc')).min(1),
    ),
    distinct: stringOrArrayValidation,
  };
  if (queryFields?.length > 0) {
    paginationValidation.q = Joi.string().trim().allow('');
  }

  return {
    manyValidation: baseValidation.append(paginationValidation).concat(fieldsValidations),
    getPrismaManyQuery: (ctx) => {
      const {
        sort,
        q: search,
        distinct: distinctFields,
        include: propsToInclude,
      } = ctx.query;

      const size = Number.parseInt(arrayToString(ctx.query.size ?? '10'), 10);
      const page = Number.parseInt(arrayToString(ctx.query.page ?? '1'), 10);
      const order = stringToArray(ctx.query.order ?? []);

      const query = {
        include: propsToPrismaInclude(stringToArray(propsToInclude ?? ''), includableFields),
        orderBy: propsToPrismaSort(stringToArray(sort ?? ''), order),
        take: Number.isInteger(size) && size > 0 ? size : undefined,
        skip: Number.isInteger(size) ? size * (page - 1) : undefined,

        distinct: distinctFields && stringToArray(distinctFields),

        where: applyPrismaFilters(ctx.query, fieldsFilters),
      };

      // Apply the search
      if (queryFields?.length > 0 && search) {
        query.where = {
          ...query.where,
          ...applyPrismaSearch(queryFields, arrayToString(search)),
        };
      }

      return query;
    },

    oneValidation: baseValidation,
    getPrismaOneQuery: (ctx, where = {}) => {
      const { include: propsToInclude } = ctx.query;

      return {
        include: propsToPrismaInclude(stringToArray(propsToInclude ?? ''), includableFields),
        where,
      };
    },
  };
};

module.exports = {
  stringOrArrayValidation,
  prepareStandardQueryParams,
};
