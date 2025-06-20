/**
 * This script is used manually (`node tmp.mjs`) to clean a `schema.src.json` file
 * and output it as `schema.json`.
 */

import { readFile, writeFile } from 'node:fs/promises';

function clean(val) {
  if (typeof val !== 'object' || Array.isArray(val)) {
    return;
  }

  for (const [key, value] of Object.entries(val)) {
    if (key === 'examples' || key.startsWith('x-')) {
      delete val[key];
      continue;
    }

    clean(value);
  }
}

const schema = JSON.parse(await readFile('./schema.src.json', 'utf-8'));
clean(schema);
await writeFile('./schema.json', JSON.stringify(schema, null, 2));
