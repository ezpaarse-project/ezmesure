const elastic = require('./elastic');

const { appLogger } = require('./logger');

const calcMetrics = async () => {
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
    }, { requestTimeout: '600s' });
  } catch (err) {
    appLogger.error('[metric]: updated global metrics');
    appLogger.error(err.message);
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

  const metrics = {
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

  return metrics;
};

let metricsPromise;
async function getMetrics(refresh = false) {
  if (!metricsPromise || refresh) {
    metricsPromise = calcMetrics();
  }

  return metricsPromise;
}

module.exports = {
  getMetrics,
};
