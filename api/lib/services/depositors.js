const config = require('config');
const { CronJob } = require('cron');

const elastic = require('./elastic');
const indexTemplate = require('../utils/depositors-template');
const { sheets } = require('./google');
const { appLogger } = require('../../server');

const { index, cron, spreadsheetId } = config.get('depositors');
const { spreadsheets } = sheets;

const job = new CronJob(cron, () => {
  updateDepositors().then((result) => {
    appLogger.info('Depositors updated');

    if (result.errors) {
      result.items.forEach((item) => {
        if (item.error) {
          appLogger.error(`Failed to update depositor ${item.name} : ${item.error}`);
        }
      });
    }
  }).catch((err) => {
    appLogger.error(`Failed to update depositors : ${err.statusCode} | ${err.message}`);
  });
});

job.start();

elastic.indices.exists({ index })
  .then(({ body: exists }) => {
    if (!exists) { job.fireOnTick(); }
  })
  .catch((err) => {
    appLogger.error(`Failed to check depositors index existence : ${err.statusCode} | ${err.message}`);
  });

/**
 * Get depositors from the index
 */
async function getFromIndex() {
  const { body } = await elastic.search({
    index,
    size: 1000,
    ignoreUnavailable: true,
  });

  if (!body || !body.hits || !body.hits.hits) {
    throw new Error('invalid elastic response');
  }

  const depositors = body.hits.hits.map((hit) => {
    const depositor = hit._source;

    if (!depositor) {
      return {};
    }

    if (!depositor.contact || !depositor.contact.confirmed) {
      depositor.contact = {};
    }

    return depositor;
  });

  return depositors;
}

/**
 * Update the depositors index
 */
async function updateDepositors() {
  const depositors = await fetchDepositors();

  try {
    await elastic.indices.delete({ index, ignoreUnavailable: true });
    await elastic.indices.create({ index, body: indexTemplate });
  } catch (e) {
    e.status = 500;
    throw e;
  }

  const result = {
    errors: false,
    items: [],
  };

  for (const dep of depositors) {
    const prefix = dep.index && dep.index.prefix;

    const item = {
      name: dep.organisation && dep.organisation.name,
      prefix,
    };

    result.items.push(item);

    if (prefix) {
      const { body } = await elastic.count({
        index: `${prefix}*`,
      });

      item.count = dep.index.count = body.count;
    }

    try {
      const { body } = await elastic.index({
        index,
        body: dep,
      });

      item.result = body.result;
    } catch (e) {
      result.errors = true;
      item.error = e.message;
    }
  }

  return result;
}

/**
 * Extract partners from the google spreadsheet
 */
function fetchDepositors() {
  return new Promise((resolve, reject) => {
    spreadsheets.values.get({
      spreadsheetId,
      range: 'ezmesure-correspondants',
    }, (err, response) => {
      if (err) { return reject(err); }

      if (!Array.isArray(response && response.values)) {
        return resolve([]);
      }

      if (response.values.length <= 1) {
        return resolve([]);
      }

      const columns = response.values.shift().map(camelize);

      const rows = response.values.map((row) => {
        const org = {};

        columns.forEach((column, i) => {
          if (row[i]) { org[column] = row[i]; }
        });

        const doc = {
          index: {
            prefix: org.indexPrefix,
          },
          organisation: {
            name: org.organisme,
            label: org.uaiLibelle,
            uai: org.uaiIdentifiant,
            city: org.localisationVille,
            website: org.siteWeb,
            logoUrl: org.logo,
          },
          contact: {
            confirmed: !!(org.mailEnvoi && org.mailRetour),
            tech: {
              firstName: org.correspondantTechniquePrenom,
              lastName: org.correspondantTechniqueNom,
              mail: org.correspondantTechniqueMail,
            },
            doc: {
              firstName: org.correspondantDocumentairePrenom,
              lastName: org.correspondantDocumentaireNom,
              mail: org.correspondantDocumentaireMail,
            },
          },
          auto: {
            ezmesure: !!org.automatisationEzpaarse,
            ezpaarse: !!org.automatisationEzmesure,
            report: !!org.automatisationRapport,
          },
        };

        if (org.longitude && org.latitude) {
          doc.location = {
            lon: parseFloat(org.longitude),
            lat: parseFloat(org.latitude),
          };
        }

        return doc;
      });

      resolve(rows);
    });
  });
}

function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => (index == 0 ? letter.toLowerCase() : letter.toUpperCase())).replace(/\W+/g, '');
}

module.exports = {
  update: updateDepositors,
  getFromIndex,
};
