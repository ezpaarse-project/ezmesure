
const axios = require('axios');

const elastic = require('./elastic');
const indexTemplate = require('../utils/onisep-template');

const index = 'onisep';

async function insertDocuments(docs = []) {
  const result = {
    failed: 0,
    inserted: 0,
    updated: 0,
    errors: [],
  };

  if (!Array.isArray(docs) || docs.length === 0) {
    return result;
  }

  const bulkItems = [];

  docs.forEach((doc) => {
    bulkItems.push({ index: { _index: index } });
    bulkItems.push(doc);
  });

  const { body: bulkResult } = await elastic.bulk({ body: bulkItems });


  (bulkResult.items || []).forEach((i) => {
    if (!i.index) {
      result.failed += 1;
    } else if (i.index.result === 'created') {
      result.inserted += 1;
    } else if (i.index.result === 'updated') {
      result.updated += 1;
    } else {
      if (result.errors.length < 10) {
        result.errors.push(i.index.error);
      }
      result.failed += 1;
    }
  });

  return result;
}

async function recreateIndex() {
  const { body: exists } = await elastic.indices.exists({ index });

  if (exists) {
    await elastic.indices.delete({ index });
  }

  await elastic.indices.create({
    index,
    body: indexTemplate,
  });
}

async function update() {
  const { data } = await axios({
    method: 'get',
    url: 'https://api.opendata.onisep.fr/downloads/57da952417293/57da952417293.json',
    timeout: 30000,
    headers: {
      'Application-ID': 'ezMESURE',
    },
  });

  if (!Array.isArray(data)) {
    return Promise.reject(new Error('Got invalid response from the Onisep API'));
  }

  await recreateIndex();
  return insertDocuments(data);
}

function search(queryString) {
  const query = {};

  if (queryString) {
    query.query_string = {
      query: `*${queryString}*`,
      fields: [
        'code_uai',
        'n_siret',
        'nom',
        'sigle',
        'universite',
        'commune',
        'departement',
        'academie',
        'region',
      ],
    };
  } else {
    query.match_all = {};
  }

  return elastic.search({
    index,
    size: 15,
    ignoreUnavailable: true,
    body: {
      query,
    },
  });
}

module.exports = {
  update,
  search,
};
