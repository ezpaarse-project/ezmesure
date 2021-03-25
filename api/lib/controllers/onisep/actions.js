const onisep = require('../../services/onisep');

exports.getOnisepData = async (ctx) => {
  const { q: query } = ctx.query;

  const { body } = await onisep.search(query);

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

exports.refreshOnisepData = async (ctx) => {
  const result = await onisep.update();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = result;
};
