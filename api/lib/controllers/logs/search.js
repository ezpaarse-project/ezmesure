const elastic = require('../../services/elastic');

const { getElasticUsername } = require('./utils');

module.exports = async (ctx) => {
  ctx.action = 'indices/search';
  const { index } = ctx.request.params;

  const { body } = ctx.request;

  const username = getElasticUsername(ctx);

  const { body: result } = await elastic.search(
    {
      index,
      body,
      timeout: '30s',
    },
    { headers: { 'es-security-runas-user': username } },
  );

  ctx.type = 'json';
  ctx.body = result;
};
