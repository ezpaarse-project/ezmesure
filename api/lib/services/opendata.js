
const config = require('config');
const axios = require('axios');
const { CronJob } = require('cron');

const elastic = require('./elastic');
const indexTemplate = require('../utils/opendata-template');

const { cron, index } = config.get('opendata');

const datasets = [
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
  const results = [];

  await recreateIndex();

  for (let i = 0; i < datasets.length; i += 1) {
    const datasetId = datasets[i];

    // eslint-disable-next-line no-await-in-loop
    const { data } = await axios({
      method: 'get',
      url: `https://data.enseignementsup-recherche.gouv.fr/explore/dataset/${datasetId}/download`,
      params: {
        format: 'json',
        timezone: 'Europe/Berlin',
        use_labels_for_header: false,
      },
      timeout: 50000,
      headers: {
        'Application-ID': 'ezMESURE',
      },
    });

    if (!Array.isArray(data)) {
      return Promise.reject(new Error('Got invalid response from the OpenData API'));
    }

    const docs = data
      .filter((doc) => doc && doc.fields)
      .map((doc) => {
        const { fields, geometry } = doc;

        // fields.coordonnees can be wrong, so we use geometry.coordinates instead
        if (Array.isArray(geometry && geometry.coordinates)) {
          const [lon, lat] = geometry.coordinates;
          fields.coordonnees = { lat, lon };
        }

        fieldsTranslations.forEach((targetField, sourceField) => {
          fields[targetField] = fields[sourceField];
          fields[sourceField] = undefined;
        });

        if (!fields.localisation && fields.dep_nom && fields.reg_nom) {
          fields.localisation = `${fields.reg_nom}>${fields.dep_nom}`;
        }

        return fields;
      });

    results.push({
      id: datasetId,
      // eslint-disable-next-line no-await-in-loop
      result: await insertDocuments(docs),
    });
  }

  return results;
}

function search(queryString) {
  const query = {};

  if (queryString) {
    query.query_string = {
      query: `*${queryString}*`,
      default_operator: 'and',
      fields: [
        'uo_lib_officiel^3',
        'uo_lib^3',
        'aca_nom^2',
        'localisation^2',
        'siren',
        'dep_nom',
        'siret',
        'uucr_nom',
        'nom_court',
        'identifiant_ror',
        'reg_nom',
        'sigle',
        'uai',
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

async function startCron(appLogger) {
  let indexExists = true;

  try {
    const { body } = await elastic.indices.exists({ index });
    indexExists = body;
  } catch (e) {
    appLogger.error(`Failed to check the index '${index}' exists: ${e.message}`);
  }

  const job = new CronJob({
    cronTime: cron,
    runOnInit: !indexExists,
    onTick: async () => {
      let results;

      appLogger.info('Refreshing OpenData');

      try {
        results = await update();
      } catch (e) {
        appLogger.error(`Failed to update OpenData : ${e.message}`);
        return;
      }

      if (Array.isArray(results)) {
        results.forEach((dataset) => {
          const {
            inserted = 0,
            updated = 0,
            failed = 0,
            errors,
          } = (dataset.result || {});

          appLogger.info(`[OpenData][${dataset.id}] ${inserted} inserted, ${updated} updated, ${failed} failed`);

          if (Array.isArray(errors)) {
            errors.forEach((error) => {
              appLogger.error(`[OpenData][${dataset.id}] ${error}`);
            });
          }
        });
      }

      appLogger.info('OpenData refreshed');
    },
  });

  job.start();
}

module.exports = {
  startCron,
  update,
  search,
};
