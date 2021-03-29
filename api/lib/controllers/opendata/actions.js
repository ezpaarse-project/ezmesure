const opendata = require('../../services/opendata');

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
  const result = await opendata.update();

  ctx.type = 'json';
  ctx.status = 200;
  ctx.body = result;
};
