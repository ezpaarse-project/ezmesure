const onisep = require('../../services/onisep');

exports.getOnisepData = async (ctx) => {
  const { q: query } = ctx.query;

  const { body: results } = await onisep.search(query);

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = results && results.hits;
};

exports.refreshOnisepData = async (ctx) => {
  const result = await onisep.update();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = result;
};
