/* eslint-disable max-len */
/**
 * @typedef {@import('@elastic/elasticsearch').estypes.QueryDslQueryContainer} QueryDslQueryContainer
 */
/* eslint-enable max-len */

/**
 * Transform a unique filter into an ES one
 *
 * @param {object} filter The filter
 *
 * @returns  {QueryDslQueryContainer}
 */
function filterToEs(filter) {
  if ('raw' in filter) {
    return filter.raw;
  }

  if (!filter.value) {
    return { exists: { field: filter.field } };
  }

  const value = Array.isArray(filter.value) ? filter.value : [filter.value];
  if (value.length === 1) {
    return { match_phrase: { [filter.field]: value[0] } };
  }

  return {
    bool: {
      should: value.map(
        (v) => ({ match_phrase: { [filter.field]: v } }),
      ),
    },
  };
}

/**
 * Transform a list of filters into an ES query
 *
 * @param {any} values Array of filter
 *
 * @returns {QueryDslQueryContainer}
 */
function filtersToESQuery(values) {
  const filters = Array.isArray(values) ? values : [values];

  /** @type {QueryDslQueryContainer[]} */
  const must = [];
  /** @type {QueryDslQueryContainer[]} */
  const mustNot = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const filter of filters) {
    const item = filterToEs(filter);
    if (filter.isNot) {
      mustNot.push(item);
    } else {
      must.push(item);
    }
  }

  return {
    bool: {
      filter: must,
      must_not: mustNot,
    },
  };
}

module.exports = {
  filtersToESQuery,
};
