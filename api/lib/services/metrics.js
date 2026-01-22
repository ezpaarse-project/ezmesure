const elastic = require('./elastic');

const { metrics: indexTemplate } = require('../utils/index-templates');

const { appLogger } = require('./logger');

const index = '.ezmesure-metrics';

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
exports.getMetrics = (refresh = false) => {
  if (!metricsPromise || refresh) {
    metricsPromise = calcMetrics();
  }

  return metricsPromise;
};

exports.save = async (ctx) => {
  const { body: exists } = await elastic.indices.exists({ index });

  if (!exists) {
    await elastic.indices.create({
      index,
      body: indexTemplate,
    });
  }

  const metric = {
    datetime: ctx.startTime,
    action: ctx.action,
    index: ctx.index,
    responseTime: ctx.responseTime,
    metadata: ctx.metadata,
    request: ctx.httpLog,
    response: {
      status: ctx.status,
      body: typeof ctx.body === 'object' ? ctx.body : null,
    },
  };

  switch (ctx.action) {
    case 'indices/list':
    case 'indices/search':
    case 'export/counter5':
    case 'file/list':
    case 'sushi/create':
    case 'sushi/update':
    case 'sushi/delete-many':
    case 'sushi/download-report':
    case 'sushi/harvest':
    case 'sushi/import':
    case 'institutions/import':
    case 'sushi/check-connection':
      if (metric.response.body && !metric.response.body.error) {
        metric.response.body = null;
      }
      break;
    default:
  }

  const username = ctx.state && ctx.state.user && ctx.state.user.username;

  if (username) {
    const user = await elastic.security.findUser({ username });

    metric.user = !user ? null : {
      name: user.username,
      roles: user.roles,
      idp: user.metadata && user.metadata.idp,
    };
  }

  return elastic.index({
    index,
    body: metric,
  }).then((res) => res.body);
};
