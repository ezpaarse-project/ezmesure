
const elastic = require('../../services/elastic');

module.exports = async function (ctx, index) {
  ctx.action = 'indices/search';
  ctx.type = 'json';

  const { body } = ctx.request;

  const { body: result } = await elastic.search({
    index,
    body,
    timeout: '30s',
  }, {
    headers: { 'es-security-runas-user': ctx.state.user.username },
  });

  ctx.body = result;
};
