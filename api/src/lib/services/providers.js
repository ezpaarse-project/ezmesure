import elastic from './elastic.js';
import config from 'config';
import co from 'co';

export default { check, register, load, list, remove }

/**
 * Apply all providers
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

      const aggregations = yield aggregate(
        config.target.index,
        config.target.field,
        config.condition
      );
      const buckets = aggregations && aggregations.agg && aggregations.agg.buckets;

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
  // .then(() => {
  //   setTimeout(check, 600000);
  // }).catch(err => {
  //   console.error(err);
  //   setTimeout(check, 600000);
  // });
}

function update(index, search, doc) {
  const query = { term: {} };
  query.term[search.key] = search.value;

  let script = '';

  for (const p in doc) {
    script += `ctx._source['${p}'] = ${p};`;
  }

  return elastic.updateByQuery({
    "index": index,
    "type": "event",
    "body": {
      "conflicts": "proceed",
      "query": query,
      "script" : {
        "lang": "groovy",
        "inline": script,
        "params": doc
      }
    }
  });
}

function search(index, key, value) {
  const query = { term: {} };
  query.term[key] = value;

  return elastic.search({
    "index": index,
    "type": "meta",
    "body": {
      "size": 1,
      "query": query
    }
  }).then(response => response.hits.hits[0]);
}

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
  }).then(response => response.aggregations);
}

/**
 * Register a meta provider
 * @param  {Object} options  name       used to name the index
 *                           key        key field used for the matching
 *                           condition  field name, no enrichment if it exists
 *                           target     index pattern that will be enriched
 *                           field      field to use for key matching
 */
function register(options) {
  const indexName = `.meta-${options.name}`;

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

function list() {
  return elastic.search({
    "index": ".meta-*",
    "type": "config"
  });
}

function remove(providerName) {
  const indexName = `.meta-${providerName}`;

  if (indexName.includes('*')) { throw new Error('* not allowed in name'); }

  return elastic.indices.delete({
    "index": indexName
  });
}
