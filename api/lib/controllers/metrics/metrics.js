const elastic = require('../../services/elastic');
const { appLogger } = require('../../services/logger');

let metrics = {};

exports.getMetric = async () => {
  appLogger.info('[metric]: Get metric is started');
  let result;
  try {
    result = await elastic.search({
      body: {
        size: 0,
        track_total_hits: true,
        aggs: {
          indices: { cardinality: { field: '_index' } },
          titles: { cardinality: { field: 'publication_title' } },
          platforms: { cardinality: { field: 'platform' } },
          maxDate: { max: { field: 'datetime' } },
          minDate: { min: { field: 'datetime' } },
        },
      },
    });
  } catch (err) {
    appLogger.error('[metric]: Cannot get metrics in elastic');
    return;
  }

  const {
    took,
    hits = {},
    aggregations = {},
  } = result.body;

  const {
    titles = {},
    platforms = {},
    indices = {},
    minDate = {},
    maxDate = {},
  } = aggregations;

  let days = 0;

  if (minDate.value && maxDate.value) {
    days = Math.ceil((maxDate.value - minDate.value) / (24 * 60 * 60 * 1000));
  }

  metrics = {
    took,
    docs: hits.total && hits.total.value,
    dateCoverage: {
      min: minDate.value,
      max: maxDate.value,
    },
    metrics: {
      days,
      titles: titles.value,
      platforms: platforms.value,
      indices: indices.value,
    },
  };
  appLogger.info(`docs: ${metrics.docs} | titles: ${metrics.metrics.titles} | platforms: ${metrics.metrics.platforms} | indices: ${metrics.metrics.indices}`);
  appLogger.info('[metric]: Get metric is end');
};

/**
 * Return global aggregated metrics
 */
exports.overall = (ctx) => {
  ctx.type = 'json';
  ctx.body = metrics;
};
