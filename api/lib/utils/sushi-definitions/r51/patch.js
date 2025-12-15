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

/**
 * Fix performances needing at least 2 properties in schema
 * while actually needing one given the case
 *
 * Update by reference
 *
 * @deprecated should be fixed by R5.1.1
 *
 * @param  {...object} schemas to fix
 */
function fixPerfMinProperties(...schemas) {
  // eslint-disable-next-line no-restricted-syntax
  for (const schema of schemas) {
    if (schema.type === 'object') {
      schema.minProperties = 1;
    }
  }
}
/**
 * Fix ISBN format by removing the need of having hyphens
 *
 * Update by reference
 *
 * @deprecated should be fixed by R5.1.1
 *
 * @param  {...object} schemas to fix
 */
function fixISBNHyphens(...schemas) {
  // eslint-disable-next-line no-restricted-syntax
  for (const schema of schemas) {
    if (schema.type === 'object' && !!schema.properties?.ISBN) {
      schema.properties.ISBN = {
        oneOf: [
          // Keep original validation
          schema.properties.ISBN,
          // Add un-hyphened validation
          {
            type: 'string',
            pattern: '^97[89][0-9]+$',
            minLength: 13,
            maxLength: 13,
          },
        ],
      };
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

fixPerfMinProperties(
  defSchema.definitions.TR_Performance,
  defSchema.definitions.TR_B2_Performance,
);

fixISBNHyphens(defSchema.definitions.Item_ID);

module.exports = defSchema;
