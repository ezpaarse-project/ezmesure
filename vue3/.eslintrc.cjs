/* eslint-disable import/no-extraneous-dependencies */
const path = require('node:path');
const createAliasSetting = require('@vue/eslint-config-airbnb/createAliasSetting');

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-essential',
    '@vue/eslint-config-airbnb',
    '@nuxt/eslint-config',
  ],
  overrides: [
    {
      files: ['store/**'],
      rules: {
        'import/prefer-default-export': 'off',
      },
    },
  ],
  settings: {
    ...createAliasSetting({
      '@': `${path.resolve(__dirname, './')}`,
      '#imports': `${path.resolve(__dirname, './.nuxt/imports.d.ts')}`,
    }),
  },
};
