const elastic = require('.');

/* eslint-disable max-len */
/**
 * @typedef {import('.').ESResponse} ESResponse
 * @typedef {import('@elastic/elasticsearch/lib/Transport.d.ts').TransportRequestOptions} TransportRequestOptions
 * @typedef {import('@elastic/elasticsearch').default.estypes.IndicesGetResponse} GetIndexResponse
 * @typedef {import('@elastic/elasticsearch').default.estypes.IndicesCreateResponse} IndicesCreateResponse
 * @typedef {import('@elastic/elasticsearch').default.estypes.IndicesPutAliasResponse} IndicesPutAliasResponse
 * @typedef {import('@elastic/elasticsearch/api/requestParams.d.ts').IndicesPutIndexTemplate<import('@elastic/elasticsearch').default.estypes.IndicesPutIndexTemplateRequest['body']>} IndicesPutIndexTemplateRequest
 * @typedef {import('@elastic/elasticsearch').default.estypes.IndicesPutIndexTemplateResponse} IndicesPutIndexTemplateResponse
 * @typedef {import('@elastic/elasticsearch').default.estypes.IndicesDeleteIndexTemplateResponse} IndicesDeleteIndexTemplateResponse
 * @typedef {import('@elastic/elasticsearch').default.estypes.IndicesDeleteResponse} IndicesDeleteResponse
 * @typedef {import('@elastic/elasticsearch').default.estypes.IndicesDeleteAliasResponse} IndicesDeleteAliasResponse
 * @typedef {import('@elastic/elasticsearch').default.estypes.IndicesStatsResponse} IndicesStatsResponse
 * @typedef {import('@elastic/elasticsearch').default.estypes.IndicesExistsResponse} IndicesExistsResponse
 * @typedef {import('@elastic/elasticsearch').default.estypes.ClusterPutComponentTemplateRequest} ClusterPutComponentTemplateRequest
 * @typedef {import('@elastic/elasticsearch').default.estypes.ClusterGetComponentTemplateResponse} ClusterGetComponentTemplateResponse
*/
/* eslint-enable max-len */

/**
 * get index in elastic.
 *
 * @param {string} indexName - index name.
 * @param {Object} opts - options.
 * @param {TransportRequestOptions} [requestConfig] Request config (timeouts, headers, ignore...)
 *
 * @return {Promise<ESResponse<GetIndexResponse>>} index.
 */
exports.get = async function getIndex(indexName, opts, requestConfig) {
  return elastic.indices.get({
    index: indexName,
    ...opts,
  }, requestConfig);
};

/**
 * Create index in elastic.
 *
 * @param {string} indexName - index name.
 * @param {string} mapping - mapping of index.
 * @param {TransportRequestOptions} [requestConfig] Request config (timeouts, headers, ignore...)
 *
 * @return {Promise<IndicesCreateResponse>} index created.
 */
exports.create = async function createIndex(indexName, mapping, requestConfig) {
  return elastic.indices.create({
    index: indexName,
    body: mapping,
  }, requestConfig);
};

/**
 * delete index in elastic.
 *
 * @param {string} indexName - index name.
 * @param {TransportRequestOptions} [requestConfig] Request config (timeouts, headers, ignore...)
 *
 * @return {Promise<ApiResponse<IndicesDeleteResponse>>} index.
 */
exports.delete = async function deleteIndex(indexName, requestConfig) {
  return elastic.indices.delete({
    index: indexName,
  }, requestConfig);
};

/**
 * Upsert an index template
 * @param {IndicesPutIndexTemplateRequest} body The template definition
 * @param {TransportRequestOptions} [requestConfig] Request config (timeouts, headers, ignore...)
 * @returns {Promise<ApiResponse<IndicesPutIndexTemplateResponse>>}
 */
exports.upsertTemplate = async function upsertTemplate(body, requestConfig) {
  return elastic.indices.putIndexTemplate(body, requestConfig);
};

/**
 * Delete an index template
 * @param {string} templateName The template name
 * @param {TransportRequestOptions} [requestConfig] Request config (timeouts, headers, ignore...)
 * @returns {Promise<ApiResponse<IndicesDeleteIndexTemplateResponse>>}
 */
exports.deleteTemplate = async function deleteTemplate(templateName, requestConfig) {
  return elastic.indices.deleteIndexTemplate({ name: templateName }, requestConfig);
};

/**
 * Upsert a index template component
 *
 * @param {ClusterPutComponentTemplateRequest} body - The content
 * @param {TransportRequestOptions} [requestConfig] Request config
 * @returns {Promise<ApiResponse<ClusterGetComponentTemplateResponse>>}
 */
exports.upsertTemplateComponent = async function upsertTemplateComponent(
  body,
  requestConfig,
) {
  return elastic.cluster.putComponentTemplate(body, requestConfig);
};

/**
 * Create an alias in elastic.
 *
 * @param {string} aliasName The name of the alias
 * @param {string} indexName The name of the index targeted by the alias
 * @param {object} [filter] The filter for the alias
 * @param {TransportRequestOptions} [requestConfig] - Request config (timeouts, headers, ignore...)
 *
 * @returns {Promise<ESResponse<IndicesPutAliasResponse>>} alias created
 */
exports.upsertAlias = async function upsertAlias(aliasName, indexName, filter, requestConfig) {
  return elastic.indices.putAlias({
    name: aliasName,
    index: indexName,
    body: filter ? { filter } : undefined,
  }, requestConfig);
};

/**
 * Delete an alias from all indices in elastic.
 *
 * @param {string} aliasName The name of the alias
 * @param {TransportRequestOptions} [requestConfig] Request config (timeouts, headers, ignore...)
 *
 * @returns {Promise<ApiResponse<IndicesDeleteAliasResponse>>} alias deleted
 */
exports.deleteAlias = async function deleteAlias(aliasName, requestConfig) {
  return elastic.indices.deleteAlias({ index: '*', name: aliasName }, requestConfig);
};

/**
 * delete all indices in elastic.
 *
 * @param {TransportRequestOptions} [requestConfig] Request config (timeouts, headers, ignore...)
 *
 * @return {Promise<ApiResponse<IndicesDeleteResponse>>} index.
 */
exports.removeAll = async function removeAllIndices(requestConfig) {
  if (process.env.NODE_ENV !== 'dev') { return null; }

  const res = await elastic.cat.indices({ format: 'json' });
  let indices = res.body;
  indices = indices.filter((index) => index.index.charAt(0) !== '.').map((index) => index.index);

  if (indices.length === 0) { return; }

  return elastic.indices.delete({
    index: indices,
    requestConfig,
  });
};

/**
 * get stats of indices in elastic.
 *
 * @param {Object} body - body of search.
 * @param {TransportRequestOptions} [requestConfig] Request config (timeouts, headers, ignore...)
 *
 * @return {Promise<ApiResponse<IndicesStatsResponse>>} index.
 */
exports.stats = async function statsIndices(body, requestConfig) {
  return elastic.indices.stats(body, requestConfig);
};

/**
 * check if index exist in elastic.
 *
 * @param {string} indexName - index name.
 * @param {TransportRequestOptions} [requestConfig] Request config (timeouts, headers, ignore...)
 *
 * @return {Promise<ApiResponse<IndicesExistsResponse>>} index.
 */
exports.exists = async function existIndex(indexName, requestConfig) {
  return elastic.indices.exists({
    index: indexName,
  }, requestConfig);
};
