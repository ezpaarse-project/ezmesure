const elasticsearch = require('../../services/elastic');

/**
 * Return global aggregated metrics
 */
exports.overall = async function (ctx, index) {
  ctx.type = 'json';

  const result = await elasticsearch.search({
    type: 'event',
    body: {
      size: 0,
      aggs : {
        indices   : { cardinality: { field: '_index' } },
        titles    : { cardinality: { field: 'publication_title' } },
        platforms:  { cardinality: { field: 'platform' } },
        maxDate   : { max : { field: 'datetime' } },
        minDate   : { min : { field: 'datetime' } }
      }
    }
  });

  const {
    took,
    hits = {},
    aggregations = {}
  } = result;

  const {
    titles = {},
    platforms = {},
    indices = {},
    minDate = {},
    maxDate = {}
  } = aggregations;

  let days = 0;

  if (minDate.value && maxDate.value) {
    days = Math.ceil((maxDate.value - minDate.value) / (24 * 60 * 60 * 1000));
  }

  ctx.body = {
    took,
    docs: hits.total,
    dateCoverage: {
      min: minDate.value,
      max: maxDate.value
    },
    metrics: {
      days,
      titles: titles.value,
      platforms: platforms.value,
      indices: indices.value
    }
  };
};
