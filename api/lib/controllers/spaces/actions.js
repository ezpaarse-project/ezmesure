const kibana = require('../../services/kibana');

exports.list = async (ctx) => {
  const { data: spaces } = await kibana.getSpaces();

  if (!Array.isArray(spaces)) {
    ctx.throw(500, ctx.$t('errors.spaces.failedToQuery'));
  }

  ctx.type = 'json';
  ctx.body = spaces;
};
