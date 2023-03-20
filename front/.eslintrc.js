module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2017,
    sourceType: 'module',
  },
  env: {
    browser: true,
    node: true,
  },
  extends: [
    'airbnb-base',
    'plugin:vue/recommended',
  ],
  // required to lint *.vue files
  plugins: [
    'vue',
  ],
  // add your custom rules here
  rules: {
    'import/no-unresolved': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/order-in-components': 'off',
    'no-param-reassign': 'off',
  },
  globals: {},
  overrides: [
    {
      files: [
        'layouts/**/*.vue',
        'pages/**/*.vue',
      ],
      rules: {
        'vue/multi-word-component-names': 'off',
      },
    },
  ],
};
