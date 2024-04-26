// @ts-check

const { merge } = require('lodash');

const { stringToArray } = require('../utils');

/**
 * Transform props to include into a valid prisma `include` field
 *
 * @param {string[]} props
 * @param {(string[] | Set<string>)?} [includableFields]
 *
 * @returns {Record<string, any> | undefined}
 */
const propsToPrismaInclude = (props, includableFields) => {
  if (!Array.isArray(props)) {
    return undefined;
  }

  let propsToMap = props;
  if (includableFields && (Array.isArray(includableFields) || includableFields instanceof Set)) {
    const includable = new Set(includableFields);
    propsToMap = propsToMap.filter((p) => includable.has(p));
  }

  if (propsToMap.length <= 0) {
    return undefined;
  }

  // sorting props to avoid subfields begin overrode by parents
  propsToMap.sort((a, b) => a.length - b.length);
  return merge(
    {},
    ...propsToMap.map((prop) => {
      const [parent, ...children] = prop.split('.');

      let value = true;
      if (children?.length > 0) {
        value = { include: propsToPrismaInclude([children.join('.')]) };
      }

      return { [parent]: value };
    }),
  );
};

/**
 * Transform props to sort into a valid prisma `sort` field
 *
 * @param {string} prop
 * @param {'asc'|'desc'} order
 * @param {(string[] | Set<string>)?} [sortableFields]
 *
 * @returns {Record<string, any> | undefined}
 */
const propsToPrismaSort = (prop, order, sortableFields) => {
  if (!prop) {
    return undefined;
  }

  if (sortableFields && (Array.isArray(sortableFields) || sortableFields instanceof Set)) {
    const sortable = new Set(sortableFields);
    if (sortable.has(prop)) {
      return undefined;
    }
  }

  const [parent, ...children] = prop.split('.');

  let value = order;
  if (children?.length > 0) {
    value = propsToPrismaSort(children.join('.'), order);
  }

  return { [parent]: value };
};

/**
 * Transform a query to a filter
 * @param {string | string[] | undefined | null} value Value of the query parameter
 * @returns {{ in: string[] } | undefined} Prisma filter
 */
const queryToPrismaFilter = (value) => (value ? { in: stringToArray(value) } : undefined);

module.exports = {
  propsToPrismaInclude,
  propsToPrismaSort,
  queryToPrismaFilter,
};
