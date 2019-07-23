const elastic = require('../../services/elastic');

/**
 * Return global aggregated metrics
 */
exports.overall = async function (ctx, index) {
  ctx.type = 'json';

  const { body: result } = await elastic.search({
    body: {
      size: 0,
      track_total_hits: true,
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
    docs: hits.total && hits.total.value,
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
