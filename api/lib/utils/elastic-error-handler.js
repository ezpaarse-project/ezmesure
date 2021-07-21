const { ElasticsearchClientError } = require('@elastic/elasticsearch').errors;

module.exports = async function handleElasticErrors(ctx, next) {
  try {
    await next();
  } catch (e) {
    if (e instanceof ElasticsearchClientError) {
      const reason = e.meta && e.meta.body && e.meta.body.error && e.meta.body.error.reason;
      const httpError = new Error(`[Elasticsearch] ${reason || e.message}`);
      httpError.statusCode = e.meta && e.meta.statusCode;
      ctx.throw(httpError);
    }
    ctx.throw(e);
  }
};
