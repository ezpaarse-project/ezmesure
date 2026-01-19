const elastic = require('./elastic');

const { metrics: indexTemplate } = require('../utils/index-templates');

const { appLogger } = require('./logger');

// eslint-disable-next-line no-underscore-dangle
const indexTemplateVersion = indexTemplate.mappings._meta.version;

const alias = '.ezmesure-metrics';
const index = `${alias}.${indexTemplateVersion}`;

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

async function migrateIndex() {
  // Resolve indices behind alias
  const { body: aliasesPerIndex } = await elastic.indices.getAlias({ index: `${alias}*` });
  const oldIndices = Object.keys(aliasesPerIndex);
  appLogger.verbose(`[metric] Found old indices: [${oldIndices}]`);

  // Create index with new mapping
  await elastic.indices.create({
    index,
    body: indexTemplate,
  });
  appLogger.info(`[metric] Created index: [${index}]`);

  if (oldIndices.length <= 0) {
    // Add alias to created index
    await elastic.indices.putAlias({ index, name: alias });
    appLogger.verbose(`[metric] Created alias [${alias}]`);

    return;
  }

  // Reindex old indices into new one
  await elastic.reindex({
    wait_for_completion: true,
    body: {
      source: { index: oldIndices },
      dest: { index },
    },
  });
  appLogger.verbose('[metric] Migrated metrics');

  // Check if an index exists in place of alias, and delete it
  const { body: aliasAsIndex } = await elastic.indices.exists({ index: alias });
  if (aliasAsIndex) {
    await elastic.indices.delete({ index: alias });
    appLogger.info(`[metric] Deleted index: [${alias}]`);
  }

  // Add alias to created index
  await elastic.indices.putAlias({ index, name: alias });
  appLogger.verbose(`[metric] Created alias [${alias}]`);

  // Delete old indices
  if (!aliasAsIndex) {
    await elastic.indices.delete({ index: oldIndices });
    appLogger.info(`[metric] Deleted indices: [${oldIndices}]`);
  }
}

let migrationPromise;
async function ensureIndex() {
  const { body: exists } = await elastic.indices.exists({ index });

  if (exists) {
    return;
  }

  if (!migrationPromise) {
    migrationPromise = migrateIndex();
  }

  return migrationPromise;
}

async function save(ctx) {
  await ensureIndex();

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

  const { body } = await elastic.index({
    index,
    body: metric,
  });

  return body;
}

module.exports = {
  getMetrics,
  ensureIndex,
  save,
};
