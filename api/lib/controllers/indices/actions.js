const elastic = require('../../services/elastic');
const indexTemplate = require('../../utils/index-template');
const publisherTemplate = require('../../utils/publisher-template');

exports.getIndex = async (ctx) => {
  const { index } = ctx.request.params;

  const { body = {}, status } = await elastic.indices.get({ index }, { ignore: [404] });

  if (status === 404 || body.status === 404) {
    ctx.throw(404, ctx.$t('errors.index.notFound', index));
  }

  ctx.body = body;
};

exports.createIndex = async (ctx) => {
  const { query, params } = ctx.request;
  const { index } = params;

  const { body: exists } = await elastic.indices.exists({ index });

  if (exists) {
    ctx.throw(409, ctx.$t('errors.index.alreadyExists', index));
  }

  const elasticResponse = await elastic.indices.create({
    index,
    body: query?.type === 'publisher' ? publisherTemplate : indexTemplate,
  });

  ctx.body = elasticResponse?.body;
};

exports.deleteIndex = async (ctx) => {
  const { index } = ctx.request.params;

  const { body: exists } = await elastic.indices.exists({ index });

  if (!exists) {
    ctx.throw(404, ctx.$t('errors.index.notFound', index));
  }

  const { body: result } = await elastic.indices.delete({
    index,
  });
  ctx.status = (result && result.acknowledged) ? 204 : 404;
  ctx.body = result;
};
