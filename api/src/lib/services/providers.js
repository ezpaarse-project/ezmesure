import elastic from './elastic.js';
import config from 'config';
import co from 'co';

export default { check, register, load, list, remove }

/**
 * Find all providers and apply them
 * @return {Promise} return an object with a number of update by index, and eventually a message
 *                   ex: { updated: { "some-index": 1000 } }
 *                   ex: { updated: {}, message: "no meta provider" }
 */
function check() {
  return co(function* () {
    const res        = yield list();
    const providers  = res && res.hits && res.hits.hits;

    let response = { updated: {} };

    if (!providers || providers.length === 0) {
      response.message = 'no meta provider';
      return response;
    }

    for (const i in providers) {
      const index  = providers[i]._index;
      const config = providers[i]._source;

      const { buckets } = yield aggregate(
        config.target.index,
        config.target.field,
        config.condition
      );

      response.updated[config.target.index] = 0;

      if (!buckets) { continue; }

      for (const j in buckets) {
        const bucket = buckets[j];
        const metadata = yield search(index, config.key, bucket.key);

        if (!metadata || !metadata._source) { continue; }

        const updateResponse = yield update(
          config.target.index,
          { key: config.target.field, value: bucket.key },
          metadata._source
        );

        response.updated[config.target.index] += updateResponse.updated;
      }
    }

    return response;
  });
}

/**
 * Update all documents matching a search
 * @param  {String} index  the index pattern for the search
 * @param  {Object} search the search query
 * @param  {Object} doc    the document used for the update
 * @return {Promise}       raw reponse of an ES update by query
 */
function update(index, search, doc) {
  let script = '';

  for (const p in doc) {
    script += `ctx._source['${p}'] = ${p};`;
  }

  return elastic.updateByQuery({
    "index": index,
    "type": "event",
    "body": {
      "conflicts": "proceed",
      "query": {
        "term": { [search.key]: search.value }
      },
      "script" : {
        "lang": "groovy",
        "inline": script,
        "params": doc
      }
    }
  });
}

/**
 * Search documents with a specific key matching a value
 * @param  {String} index the index to search
 * @param  {String} key   the key to search
 * @param  {String} value the value that the key must match
 * @return {Promise}      return the documents matching the query
 */
function search(index, key, value) {
  return elastic.search({
    "index": index,
    "type": "meta",
    "body": {
      "size": 1,
      "query": {
        "term": { [key]: value }
      }
    }
  }).then(response => response.hits.hits[0]);
}

/**
 * Get documents aggregated by a specific field
 * @param  {String} index     the index to search
 * @param  {String} aggField  the field that should be aggregated
 * @param  {String} condition field name, documents with it won't be aggregated
 * @return {Promise}          return the 'aggregations' field from the
 *                            raw response of an ES aggregation query
 */
function aggregate(index, aggField, condition) {
  return elastic.search({
    "index": index,
    "type": "event",
    "body": {
      "size": 0,
      "query": {
        "bool": {
          "must_not": {
            "exists": { "field": condition }
          }
        }
      },
      "aggregations": {
        "agg": {
          "terms": {
            "field": aggField,
            "size": 50
          }
        }
      }
    }
  }).then(response => response.aggregations.agg);
}

/**
 * Register a meta provider
 * @param  {String} providerName  used to name the index
 * @param  {Object} options  key        key field used for the matching
 *                           condition  field name, no enrichment if it exists
 *                           target     index pattern that will be enriched
 *                           field      field to use for key matching
 */
function register(providerName, options) {
  const indexName = `.meta-${providerName}`;

  if (indexName.includes('*')) { throw new Error('* not allowed in name'); }

  return elastic.update({
    "index": indexName,
    "type": "config",
    "id": 1,
    "body": {
      "doc_as_upsert": true,
      "doc": {
        "key": options.key,
        "condition": options.condition,
        "target": {
          "index": options.target,
          "field": options.field
        }
      }
    }
  });
}

/**
 * Load data in a meta provider
 * @param  {String} providerName
 * @param  {Array<Object>} data  objects used as metadata
 * @return {Promise} raw response of an ES bulk query
 */
function load(providerName, data) {
  const indexName = `.meta-${providerName}`;

  if (indexName.includes('*')) { throw new Error('* not allowed in name'); }

  const body = [];
  data.forEach(m => {
    body.push({ index:  { _index: indexName, _type: 'meta' } });
    body.push(m);
  });

  return elastic.bulk({ body });
}

/**
 * Get all config documents from providers
 * @param  {String} providerName  (optional) provider name
 * @return {Promise} raw response of an ES search query
 */
function list(providerName) {
  return elastic.search({
    "index": `.meta-${providerName || '*'}`,
    "type": "config"
  });
}

/**
 * Delete a provider index
 * @param  {String} providerName
 * @return {Promise} raw response of an ES delete query
 */
function remove(providerName) {
  const indexName = `.meta-${providerName}`;

  if (indexName.includes('*')) { throw new Error('* not allowed in name'); }

  return elastic.indices.delete({
    "index": indexName
  });
}
