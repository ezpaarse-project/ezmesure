const defSchema = require('./schema.json');

// Patches definitions

/**
 * Fix Registry_Record regex to allow old registry url
 *
 * Update by reference
 *
 * @param  {...object} schemas to fix
 */
function fixRegistryRecord(...schemas) {
  const allowedHosts = ['registry.countermetrics.org', 'registry.projectcounter.org'];
  const allowedRegex = `(${allowedHosts.join('|')})`;

  // eslint-disable-next-line no-restricted-syntax
  for (const schema of schemas) {
    if (schema?.properties?.Registry_Record) {
      const { Registry_Record: item } = schema.properties;
      item.pattern = item.pattern.replace(/registry.countermetrics.org/ig, allowedRegex);
    }
  }
}

// Patches application

fixRegistryRecord(
  defSchema.definitions.Status,
  defSchema.definitions.Base_Report_Header,
);

module.exports = defSchema;
