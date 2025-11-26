const { join } = require('node:path');

// eslint-disable-next-line import/no-extraneous-dependencies
const { defineConfig, env } = require('prisma/config');

export default defineConfig({
  schema: join('prisma'),

  datasource: {
    url: env('EZMESURE_POSTGRES_URL'),
  },
});
