const elastic = require('.');

/**
 * get index in elastic.
 *
 * @param {string} indexName - index name.
 * @param {Object} opts - options.
 * @param {Object} requestConfig - config of request (timeouts, headers, ignore, and so on).
 *
 * @return {Promise<>} index.
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
 * @param {Object} requestConfig - config of request (timeouts, headers, ignore, and so on).
 *
 * @return {Promise<>} index created.
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
 * @param {Object} requestConfig - config of request (timeouts, headers, ignore, and so on).
 *
 * @return {Promise<>} index.
 */
exports.delete = async function deleteIndex(indexName, requestConfig) {
  return elastic.indices.delete({
    index: indexName,
  }, requestConfig);
};

/**
 * delete all indices in elastic.
 *
 * @param {Object} requestConfig - config of request (timeouts, headers, ignore, and so on).
 *
 * @return {Promise<>} index.
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
 * @param {Object} requestConfig - config of request (timeouts, headers, ignore, and so on).
 *
 * @return {Promise<>} index.
 */
exports.stats = async function statsIndices(body, requestConfig) {
  return elastic.indices.stats(body, requestConfig);
};

/**
 * check if index exist in elastic.
 *
 * @param {string} indexName - index name.
 * @param {Object} requestConfig - config of request (timeouts, headers, ignore, and so on).
 *
 * @return {Promise<>} index.
 */
exports.exists = async function existIndex(indexName, requestConfig) {
  return elastic.indices.exists({
    index: indexName,
  }, requestConfig);
};
