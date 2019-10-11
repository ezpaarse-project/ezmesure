const { googleAPI } = require('config');
const google = require('googleapis');

const auth = new google.auth.JWT(
  googleAPI.clientEmail,
  null,
  googleAPI.privateKey,
  ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  null,
);

module.exports = {
  sheets: google.sheets({
    version: 'v4',
    auth,
  }),
};
