/**
 * This script is used manually (`node tools/counter_clean-schema.mjs`) to clean a file provided as arg
 * and output it in stdout.
 *
 * Example :
 * node tools/counter_clean-schema.mjs ./COUNTER_API.json > ./api/lib/utils/sushi-definitions/r51/schema.json
 *
 * Note :
 * Can either download original or bundled
 */

import { readFile } from 'node:fs/promises';

function clean(value, key = '') {
  if (value == null) {
    return undefined;
  }

  if (key === '$ref') {
    return value.replace('components/schemas', 'definitions');
  }

  if (key === 'examples' || key.startsWith('x-')) {
    return undefined;
  }

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map((val) => clean(val));
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        clean(val, key)
      ]),
    );
  }

  return value;
}

const [path] = process.argv.slice(2);
if (!path) {
  throw new Error('Must provide path to a OpenAPI file');
}

const file = await readFile(path, 'utf-8');
const schema = JSON.parse(file);

// Remove non needed properties
schema.info.description = undefined;
schema.tags = undefined;
schema.paths = undefined;
// Clean components
const result = clean(schema);

// Rename components into definitions
result.definitions = result.components.schemas;
result.components = undefined;

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
