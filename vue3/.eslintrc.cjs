const path = require('node:path');
const createAliasSetting = require('@vue/eslint-config-airbnb/createAliasSetting');

/** @type {import('eslint').ESLint.ConfigData} */
module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-essential',
    '@vue/eslint-config-airbnb',
    '@nuxt/eslint-config',
  ],
  rules: {
    'import/no-extraneous-dependencies': 'off',
  },
  overrides: [
    {
      files: 'store/**/*.js',
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
  globals: {
    $fetch: 'readonly',
  },
};
