const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const yaml = require('js-yaml');

const defaultOptions = {
  queryField: 'locale',
  cookieName: 'locale',
  defaultLocale: 'en',
  dir: path.resolve(process.cwd(), 'locales'),
};

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
      } else if (typeof value === 'object') {
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

/**
 * Add locale functions to the app context
 * @param {Object} app the koa app
 * @param {Object} opts options
 */
module.exports = function i18n(app, opts = {}) {
  const options = { ...defaultOptions, ...opts };
  const {
    queryField,
    cookieName,
    defaultLocale,
    dir,
  } = options;

  const locales = getLocales(dir);

  /**
   * Translates a key with the current locale, interpolating values with util.format()
   * @param {String} key
   * @param  {...String} values
   * @returns String
   */
  function translate(key, ...values) {
    if (typeof key !== 'string') {
      return '';
    }

    const locale = this.getLocale();
    const dict = locales[locale];

    if (!dict || typeof dict[key] !== 'string') { return key; }

    return util.format(dict[key], ...values);
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
