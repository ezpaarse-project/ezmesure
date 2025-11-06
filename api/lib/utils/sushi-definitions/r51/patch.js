const defSchema = require('./schema.json');

// Patches definitions

/**
 * Fix Registry_Record regex to allow any string, as we don't use it in ezMESURE
 *
 * Update by reference
 *
 * @param  {...object} schemas to fix
 */
function fixRegistryRecord(...schemas) {
  // eslint-disable-next-line no-restricted-syntax
  for (const schema of schemas) {
    if (schema?.properties?.Registry_Record) {
      const { Registry_Record: item } = schema.properties;
      item.pattern = undefined;

      schema.required = schema.required.filter((property) => property !== 'Registry_Record');
    }
  }
}

/**
 * Fix Begin_Date and End_Date to allow not providing day of date
 *
 * Update by reference
 *
 * @param  {...object} schemas to fix
 */
function fixPeriodDateFormat(...schemas) {
  const pattern = '^([0-9]{4})-([0-9]{2})(-[0-9]{2})?$';

  // eslint-disable-next-line no-restricted-syntax
  for (const schema of schemas) {
    if (schema?.properties?.Begin_Date) {
      const { Begin_Date: item } = schema.properties;
      item.format = undefined;
      item.pattern = pattern;
    }
    if (schema?.properties?.End_Date) {
      const { End_Date: item } = schema.properties;
      item.format = undefined;
      item.pattern = pattern;
    }
  }
}

// Patches application

fixRegistryRecord(
  defSchema.definitions.Status,
  defSchema.definitions.Base_Report_Header,
);

fixPeriodDateFormat(
  defSchema.definitions.Base_Report_Filters,
);

module.exports = defSchema;
