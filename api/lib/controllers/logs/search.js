
const elasticsearch = require('../../services/elastic');

module.exports = async function (ctx, index) {
  ctx.action = 'indices/search';
  ctx.type   = 'json';

  const { body } = ctx.request;

  ctx.body = await elasticsearch.search({
    index,
    type: 'event',
    body,
    timeout: '30s',
    headers: { 'es-security-runas-user': ctx.state.user.username }
  });
};
