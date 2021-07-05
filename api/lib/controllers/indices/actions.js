const elastic = require('../../services/elastic');
const indexTemplate = require('../../utils/index-template');

exports.createIndex = async (ctx) => {
  const { index } = ctx.request.params;

  const { body: exists } = await elastic.indices.exists({ index });

  if (exists) {
    ctx.throw(409, ctx.$t('errors.index.alreadyExists', index));
  }

  const { body } = await elastic.indices.create({
    index,
    body: indexTemplate,
  });

  ctx.body = body;
};
