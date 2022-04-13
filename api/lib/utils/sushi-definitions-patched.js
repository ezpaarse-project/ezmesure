const defSchema = require('./sushi-definitions.json');

const {
  SUSHI_error_model: errorSchema,
  COUNTER_item_performance: itemPerfSchema,
  COUNTER_database_usage: databaseUsage,
  COUNTER_title_usage: titleUsage,
  COUNTER_item_usage: itemUsage,
} = defSchema.definitions;

// Remove Publisher from required fields
databaseUsage.required = databaseUsage.required.filter((field) => field !== 'Publisher');
titleUsage.required = titleUsage.required.filter((field) => field !== 'Publisher');
itemUsage.required = itemUsage.required.filter((field) => field !== 'Publisher');

// Allow Publisher to be null
databaseUsage.properties.Publisher = { anyOf: [databaseUsage.properties.Publisher, { type: 'null' }] };
titleUsage.properties.Publisher = { anyOf: [titleUsage.properties.Publisher, { type: 'null' }] };
itemUsage.properties.Publisher = { anyOf: [itemUsage.properties.Publisher, { type: 'null' }] };

// Remove Severity from required fields
errorSchema.required = errorSchema.required.filter((field) => field !== 'Severity');
// Allow Severity to be an integer
errorSchema.properties.Severity = { anyOf: [errorSchema.properties.Severity, { type: 'integer' }] };
// Allow Code as string
errorSchema.properties.Code = { anyOf: [errorSchema.properties.Code, { type: 'string', pattern: '^[0-9]+$' }] };

// Remove enum for metric type
const instanceSchema = itemPerfSchema.properties.Instance;
const metricType = instanceSchema.items.properties.Metric_Type;
instanceSchema.items.properties.Metric_Type = { ...metricType, enum: undefined };

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
