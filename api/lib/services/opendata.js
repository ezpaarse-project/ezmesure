const config = require('config');
const Axios = require('axios');
const Papa = require('papaparse');
const dateIsValid = require('date-fns/isValid');
const dateIsBefore = require('date-fns/isBefore');
const { CronJob } = require('cron');

const elastic = require('./elastic');
const indexTemplate = require('../utils/opendata-template');

const { cron, index } = config.get('opendata');

const axios = Axios.create({
  baseURL: 'https://data.enseignementsup-recherche.gouv.fr/api/',
});

const bulkSize = 2000;
const datasetIds = [
  'fr-esr-principaux-etablissements-enseignement-superieur',
  'fr-esr-etablissements-publics-prives-impliques-recherche-developpement',
];

const fieldsTranslations = new Map([
  ['libelle', 'uo_lib_officiel'],
  ['code_uai', 'uai'],
  ['categorie', 'type_d_etablissement'],
  ['departement', 'dep_nom'],
  ['site_web', 'url'],
  ['code_commune', 'com_code'],
  ['region', 'reg_nom'],
  ['departement', 'dep_nom'],
]);

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
        result.errors.push(JSON.stringify(i.index.error));
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

async function getDatasetsMetadata() {
  return Promise.all(datasetIds.map(async (datasetId) => {
    const { data } = await axios.get(`/datasets/1.0/${datasetId}`);
    return {
      ...data,
      id: datasetId,
    };
  }));
}

async function getIndexCreationDate() {
  const { body } = await elastic.indices.get({ index, ignoreUnavailable: true });
  const settings = body && body[index] && body[index].settings;
  const creationDate = settings && settings.index && settings.index.creation_date;
  return new Date(Number.parseInt(creationDate, 10));
}

async function updateDataset(dataset) {
  const result = {
    failed: 0,
    inserted: 0,
    updated: 0,
    errors: [],
  };

  const aggregateResults = (r = {}) => {
    result.failed += r.failed;
    result.inserted += r.inserted;
    result.updated += r.updated;

    if (result.errors.length < 10 && r.errors.length > 0) {
      result.errors = [...result.errors, ...r.errors].slice(0, 10);
    }
  };

  // eslint-disable-next-line no-await-in-loop
  const response = await axios({
    method: 'get',
    url: '/records/1.0/download',
    params: {
      dataset: dataset.id,
      format: 'csv',
      csv_separator: ';',
      timezone: 'Europe/Berlin',
    },
    responseType: 'stream',
    timeout: 30000,
    headers: {
      'Application-ID': 'ezMESURE',
    },
  });

  let items = [];

  // eslint-disable-next-line no-await-in-loop
  await new Promise((resolve, reject) => {
    Papa.parse(response.data, {
      delimiter: ';',
      header: true,
      transformHeader: (header) => fieldsTranslations.get(header) || header,
      transform: (value) => (value === '' ? undefined : value),
      complete: () => {
        if (items.length === 0) {
          resolve();
          return;
        }

        insertDocuments(items)
          .then((insertResults) => {
            aggregateResults(insertResults);
            resolve();
          })
          .catch((err) => reject(err));
      },
      error: (error) => reject(error),
      step: ({ data = {}, errors = [] }, parser) => {
        const row = data;

        if (result.errors.length < 10 && Array.isArray(errors) && errors.length > 0) {
          result.errors = [...result.errors, errors.map((e) => JSON.stringify(e))].slice(0, 10);
        }

        if (!row.localisation && row.dep_nom && row.reg_nom) {
          row.localisation = `${row.reg_nom}>${row.dep_nom}`;
        }

        items.push(row);
        if (items.length < bulkSize) { return; }

        const itemsToInsert = items.slice();
        items = [];
        parser.pause();

        insertDocuments(itemsToInsert)
          .then((insertResults) => {
            aggregateResults(insertResults);
            parser.resume();
          })
          .catch((err) => reject(err));
      },
    });
  });

  return result;
}

const searchFields = [
  { name: 'uo_lib_officiel', boost: 3 },
  { name: 'uo_lib', boost: 3 },
  { name: 'aca_nom', boost: 2 },
  { name: 'localisation', boost: 2 },
  { name: 'siren' },
  { name: 'dep_nom' },
  { name: 'siret' },
  { name: 'uucr_nom' },
  { name: 'nom_court' },
  { name: 'identifiant_ror' },
  { name: 'reg_nom' },
  { name: 'sigle' },
  { name: 'uai' },
];

function search(queryString) {
  let query = {
    match_all: {},
  };

  if (queryString) {
    const should = searchFields.map((field) => (
      {
        wildcard: {
          [field.name]: {
            value: `*${queryString}*`,
            boost: field.boost,
            case_insensitive: true,
          },
        },
      }
    ));

    query = { bool: { should } };
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

async function reloadIndex(datasets, appLogger) {
  appLogger.info('[OpenData] Recreating index');

  await recreateIndex();

  for (let i = 0; i < datasets.length; i += 1) {
    const dataset = datasets[i];
    let result;

    try {
      // eslint-disable-next-line no-await-in-loop
      result = await updateDataset(dataset);
    } catch (e) {
      appLogger.error(`[OpenData][${dataset.id}] Failed to update: ${e.message}`);
      return;
    }

    const {
      inserted = 0,
      updated = 0,
      failed = 0,
      errors,
    } = (result || {});

    appLogger.info(`[OpenData][${dataset.id}] ${inserted} inserted, ${updated} updated, ${failed} failed`);

    if (Array.isArray(errors)) {
      errors.forEach((error) => {
        appLogger.error(`[OpenData][${dataset.id}] ${error}`);
      });
    }
  }

  appLogger.info('[OpenData] Datasets refreshed');
}

async function startCron(appLogger) {
  let indexExists = true;

  try {
    const { body } = await elastic.indices.exists({ index });
    indexExists = body;
  } catch (e) {
    appLogger.error(`[OpenData] Failed to check the index '${index}' exists: ${e.message}`);
  }

  const job = new CronJob({
    cronTime: cron,
    runOnInit: !indexExists,
    onTick: async () => {
      let needRefresh;
      let datasets;

      try {
        datasets = await getDatasetsMetadata();
        const indexCreationDate = await getIndexCreationDate();

        if (!dateIsValid(indexCreationDate)) {
          appLogger.info('[OpenData] Index does not exist');
          needRefresh = true;
        } else {
          appLogger.info('[OpenData] Looking for dataset updates');
          needRefresh = datasets.some((dataset) => {
            const updatedAt = new Date(dataset && dataset.metas && dataset.metas.modified);
            return !dateIsValid(updatedAt) || dateIsBefore(indexCreationDate, updatedAt);
          });
        }
      } catch (e) {
        appLogger.error(`[OpenData] Failed to check OpenData status: ${e.message}`);
        return;
      }

      if (!needRefresh) {
        appLogger.info('[OpenData] Index is up-to-date');
        return;
      }

      await reloadIndex(datasets, appLogger);
    },
  });

  job.start();
}

module.exports = {
  startCron,
  reloadIndex,
  getDatasetsMetadata,
  getIndexCreationDate,
  search,
};
