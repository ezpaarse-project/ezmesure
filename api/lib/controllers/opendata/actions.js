const opendata = require('../../services/opendata');
const { appLogger } = require('../../../server');

exports.getOpenData = async (ctx) => {
  const { q: query } = ctx.query;

  const { body } = await opendata.search(query);

  const results = (body && body.hits && body.hits.hits);

  ctx.type = 'json';
  ctx.status = 200;

  if (Array.isArray(results)) {
    // eslint-disable-next-line no-underscore-dangle
    ctx.body = results.map((r) => r && r._source);
  } else {
    ctx.body = [];
  }
};

exports.refreshOpenData = async (ctx) => {
  const datasets = await opendata.getDatasetsMetadata();
  opendata.reloadIndex(datasets, appLogger)
    .catch((e) => {
      appLogger.error(`Failed to update Opendata datasets: ${e.message}`);
    });

  ctx.type = 'json';
  ctx.status = 202;
  ctx.body = { acknowledged: true };
};
