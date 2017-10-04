const { googleAPI } = require('config');
const google = require('googleapis');
const googleAuth = require('google-auth-library');

const spreadsheetId = '1cgK6Tvd2No-rqYzyE6OIIbS7VHZdudQGm5TuiOUc0uU';
const twentyMinutes = 1200000;
let cached;

const jwtClient = new google.auth.JWT(
  googleAPI.clientEmail,
  null,
  googleAPI.privateKey,
  ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  null
);

exports.list = function* () {
  this.type = 'json';

  yield new Promise((resolve, reject) => {
    jwtClient.authorize(function (err, tokens) {
      if (err) { return reject(err); }
      resolve();
    });
  });

  if (cached && (Date.now() - cachedAt) < twentyMinutes) {
    this.body = cached;
  } else {
    this.body = cached = yield getPartners(jwtClient);
    cachedAt = Date.now();
  }
};


/**
 * Extract partners from the google spreadsheet
 */
function getPartners(auth) {
  return new Promise((resolve, reject) => {
    const { spreadsheets } = google.sheets('v4');

    spreadsheets.values.get({
      auth: auth,
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
