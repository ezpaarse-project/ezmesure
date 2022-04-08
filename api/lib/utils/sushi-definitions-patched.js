const defSchema = require('./sushi-definitions.json');

const {
  SUSHI_error_model: errorSchema,
  COUNTER_item_performance: itemPerfSchema,
} = defSchema.definitions;

// Remove Severity from required fields
errorSchema.required = errorSchema.required.filter((field) => field !== 'Severity');

// Allow Severity to be an integer
const severity = errorSchema.properties.Severity;

errorSchema.properties.Severity = {
  anyOf: [severity, { type: 'integer' }],
};

// Remove enum for metric type
const instanceSchema = itemPerfSchema.properties.Instance;
const metricType = instanceSchema.items.properties.Metric_Type;

instanceSchema.items.properties.Metric_Type = {
  ...metricType,
  enum: undefined,
};

// Remove enum for all first-level properties
Object.values(defSchema.definitions).forEach((value) => {
  const schema = value;
  if (typeof schema?.properties !== 'object') { return; }

  Object.values(schema?.properties).forEach((propValue) => {
    const propertySchema = propValue;

    if (Array.isArray(propertySchema?.enum)) {
      propertySchema.enum = undefined;
    }
  });
});

module.exports = defSchema;
