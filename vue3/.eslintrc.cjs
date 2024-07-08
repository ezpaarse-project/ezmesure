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
      // allow extraneous dependencies for dev files
      files: ['nuxt.config.js', '.eslintrc.cjs'],
      rules: {
        'mport/no-extraneous-dependencies': 'off',
      },
    },
    {
      // allow non default exports for stores
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
