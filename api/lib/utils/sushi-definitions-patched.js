const defSchema = require('./sushi-definitions.json');

const {
  SUSHI_error_model: errorSchema,
  COUNTER_item_performance: itemPerfSchema,
  COUNTER_database_usage: databaseUsage,
  COUNTER_title_usage: titleUsage,
  COUNTER_item_usage: itemUsage,
  SUSHI_report_header: reportHeader,
} = defSchema.definitions;

/**
 * Take a type and make it nullable
 * @param {object} type - type of the property
 * @returns {object}
 */
const nullable = (type) => ({ anyOf: [type, { type: 'null' }] });

const optionalItemFields = new Set(['Platform', 'Title', 'Publisher', 'Database']);
const optionalHeaderFields = new Set(['Created', 'Created_By', 'Report_Name', 'Release', 'Institution_Name']);

// Remove some required header fields and allow them to be null
optionalHeaderFields.forEach((field) => {
  reportHeader.required = reportHeader.required.filter((f) => f !== field);
  reportHeader.properties[field] = { anyOf: [reportHeader.properties[field], { type: 'null' }] };
});

// Remove some required item fields and allow them to be null
optionalItemFields.forEach((field) => {
  databaseUsage.required = databaseUsage.required.filter((f) => f !== field);
  titleUsage.required = titleUsage.required.filter((f) => f !== field);
  itemUsage.required = itemUsage.required.filter((f) => f !== field);

  if (databaseUsage.properties[field]) {
    databaseUsage.properties[field] = nullable(databaseUsage.properties[field]);
  }
  if (titleUsage.properties[field]) {
    titleUsage.properties[field] = nullable(titleUsage.properties[field]);
  }
  if (itemUsage.properties[field]) {
    itemUsage.properties[field] = nullable(itemUsage.properties[field]);
  }
});

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
