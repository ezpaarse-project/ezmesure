const r5Template = require('./r5');
const r51Template = require('./r51');

const mergeMapping = (base, additionalProps) => ({
  ...base,
  mappings: {
    ...base.mappings,
    properties: {
      ...base.mappings.properties,
      ...additionalProps,
    },
  },
});

// Custom properties are prefixed with X_ and added at the insert step, not
// in transformers
const customProperties = {
  X_Package: { type: 'keyword' },
  X_Tags: { type: 'keyword' },
  X_Sushi_ID: { type: 'keyword' },
  X_Institution_ID: { type: 'keyword' },
  X_Endpoint_ID: { type: 'keyword' },
  X_Endpoint_Name: { type: 'keyword' },
  X_Endpoint_Tags: { type: 'keyword' },
  X_Harvest_ID: { type: 'keyword' },
  X_Harvested_At: { type: 'date' },
  X_Date_Month: { type: 'date', format: 'yyyy-MM' },
};

module.exports = new Map([
  ['5', mergeMapping(r5Template, customProperties)],
  ['5.1', mergeMapping(r51Template, customProperties)],
]);
