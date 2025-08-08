const elastic = require('../../services/elastic');
const indexTemplate = require('../../utils/index-template');
const publisherIndexTemplates = require('../../utils/sushi-templates');

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
  const { type, version } = query ?? {};

  const { body: exists } = await elastic.indices.exists({ index });

  if (exists) {
    ctx.throw(409, ctx.$t('errors.index.alreadyExists', index));
  }

  let template = indexTemplate;

  if (type === 'publisher') {
    template = publisherIndexTemplates.get(version || '5');
  }

  if (!template) {
    ctx.throw(409, ctx.$t('errors.index.noTemplateFound', version, type));
  }

  const elasticResponse = await elastic.indices.create({
    index,
    body: template,
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
