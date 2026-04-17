const fs = require('fs-extra');
const path = require('path');
const config = require('config');
const util = require('util');
const yaml = require('js-yaml');
const { template } = require('lodash');

const localesDir = path.resolve(__dirname, '../../locales');
const defaultLocale = config.get('defaultLocale');

/**
 * Flatten nested properties of an object by seperating keys with dots
 * Example: { foo: { bar: 'foo' } } => { 'foo.bar': 'foo' }
 * @param {Object} obj
 */
function flatten(obj) {
  const flattened = {};

  function flattenProp(data, keys) {
    Object.entries(data).forEach(([key, value]) => {
      const newKeys = [...keys, key];

      if (typeof value === 'string') {
        flattened[newKeys.join('.')] = value;
      } else if (typeof value === 'object' && value != null) {
        flattenProp(value, newKeys);
      }
    });
  }

  flattenProp(obj, []);

  return flattened;
}

/**
 * Read locale files in the given directory
 * @param {String} dir
 */
function getLocales(dir) {
  const locales = {};

  fs.readdirSync(dir)
    .filter((f) => f.endsWith('.yml'))
    .forEach((fileName) => {
      const locale = path.basename(fileName, '.yml').toLowerCase();
      const content = fs.readFileSync(path.resolve(dir, fileName), 'utf8');
      locales[locale] = flatten(yaml.load(content));
    });

  return locales;
}

const locales = getLocales(localesDir);

/**
 * @typedef {Function} TranslateFunction
 * @param {String} key - The key to translate
 * @param {Object} values - The values to replace in the translation
 */

/**
 * Get a translation function for a given locale
 * @param {string} locale - The locale to use for translations
 * @returns {TranslateFunction}
 */
const t = (locale) => (key, ...values) => {
  if (typeof key !== 'string') {
    return '';
  }

  const dict = locales[locale || defaultLocale];
  if (!dict || typeof dict[key] !== 'string') { return key; }

  if (values.length === 1 && typeof values[0] === 'object') {
    return template(dict[key], {
      escape: null,
      interpolate: /{{([\s\S]+?)}}/g,
    })(values[0]);
  }

  return util.format(dict[key], ...values);
};

/**
 * Add locale functions to the app context
 * @param {Object} app the koa app
 * @param {Object} opts options
 */
const init = (app, options = {}) => {
  const {
    queryField = 'locale',
    cookieName = 'locale',
  } = options;

  /**
   * Translates a key with the current locale, interpolating values with util.format()
   * @param {String} key
   * @param  {...String} values
   * @returns String
   */
  function translate(key, ...values) {
    const locale = this.getLocale();
    return t(locale)(key, ...values);
  }

  /**
   * Get the locale origin (query, cookie, header, default)
    * @returns String the locale origin
    */
  function getLocaleOrigin() {
    if (!this.state.localeOrigin) {
      this.getLocale();
    }
    return this.state.localeOrigin;
  }

  /**
   * Get the locale of the request by looking at different places
   * 1. query: /?locale=en-US
   * 2. cookie: locale=zh-TW
   * 3. header: Accept-Language: zh-CN,zh;q=0.5
   * @returns String
   */
  function getLocale() {
    if (this.state.locale) {
      return this.state.locale;
    }

    // Query
    let locale = this.query[queryField];
    let localeOrigin = 'query';

    // Cookie
    if (!locale) {
      locale = this.cookies.get(cookieName, { signed: false });
      localeOrigin = 'cookie';
    }

    // Header
    if (!locale) {
      const languages = this.acceptsLanguages();

      if (Array.isArray(languages)) {
        for (let i = 0; i < languages.length; i += 1) {
          if (typeof languages[i] === 'string') {
            const lang = languages[i].substring(0, 2).toLowerCase(); // fr-FR => fr

            if (locales[lang]) {
              locale = lang;
              localeOrigin = 'header';
              break;
            }
          }
        }
      }
    }

    // if all missing or invalid locale, use default locale
    if (!locales[locale]) {
      locale = defaultLocale;
      localeOrigin = 'default';
    }

    if (typeof locale === 'string') {
      locale = locale.substring(0, 2).toLowerCase(); // fr-FR => fr
    }

    this.state.locale = locale;
    this.state.localeOrigin = localeOrigin;
    return locale;
  }

  Object.assign(app.context, {
    $t: translate,
    getLocale,
    getLocaleOrigin,
  });
};

module.exports = {
  locales,
  t,
  init,
};
