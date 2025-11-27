const { join } = require('node:path');

// eslint-disable-next-line import/no-extraneous-dependencies
const { defineConfig } = require('prisma/config');

export default defineConfig({
  schema: join('prisma'),

  datasource: {
    url: process.env.EZMESURE_POSTGRES_URL || '',
  },
});
