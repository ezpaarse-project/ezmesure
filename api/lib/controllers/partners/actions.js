const config = require('config');
const { sheets } = require('../../services/google');

const spreadsheetId = config.get('spreadsheets.depositors');
const twentyMinutes = 1200000;
let cached;
let cachedAt;

exports.list = async function (ctx) {
  ctx.type = 'json';

  if (cached && (Date.now() - cachedAt) < twentyMinutes) {
    ctx.body = cached;
  } else {
    ctx.body = cached = await getPartners();
    cachedAt = Date.now();
  }
};


/**
 * Extract partners from the google spreadsheet
 */
function getPartners() {
  return new Promise((resolve, reject) => {
    const { spreadsheets } = sheets;

    spreadsheets.values.get({
      spreadsheetId,
      range: 'ezmesure-correspondants!A:N',
    }, function(err, response) {
      if (err) { return reject(err); }

      if (!Array.isArray(response && response.values)) {
        return resolve([]);
      }

      if (response.values.length <= 1) {
        return resolve([]);
      }

      const columns = response.values.shift().map(camelize);

      const rows = response.values.map(row => {
        let obj = {};

        columns.forEach((column, i) => {
          if (row[i]) { obj[column] = row[i]; }
        });

        if (!obj.mailEnvoi || !obj.mailRetour) {
          obj = {
            organisme: obj.organisme,
            logo: obj.logo
          };
        }

        return obj;
      });

      resolve(rows);
    });
  });
}

function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
    return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
  }).replace(/\W+/g, '');
};
