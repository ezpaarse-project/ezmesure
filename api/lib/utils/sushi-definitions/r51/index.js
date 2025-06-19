const { default: Ajv } = require('ajv');
const { default: addFormats } = require('ajv-formats');

const definitions = require('./schema.json');
const { REPORT_IDS } = require('../constants');

const ajv = new Ajv({ schemas: [definitions], strict: false });
addFormats(ajv);

module.exports.reportValidators = new Map(
  REPORT_IDS
    .map((reportId) => [reportId, ajv.getSchema(`#/definitions/${reportId.toUpperCase()}`)])
    .filter(([, schema]) => !!schema),
);

module.exports.defaultParameters = new Map([
  [
    'pr', {
      attributes_to_show: [
        'Data_Type',
        'Access_Method',
      ],
    },
  ],
  [
    'dr', {
      attributes_to_show: [
        'Data_Type',
        'Access_Method',
      ],
    },
  ],
  [
    'tr', {
      attributes_to_show: [
        'Data_Type',
        'Section_Type',
        'YOP',
        'Access_Type',
        'Access_Method',
      ],
    },
  ],
  [
    'ir', {
      include_parent_details: 'True',
      include_component_details: 'True',
      attributes_to_show: [
        'Authors',
        'Publication_Date',
        'Article_Version',
        'Data_Type',
        'YOP',
        'Access_Type',
        'Access_Method',
      ],
    },
  ],
]);
