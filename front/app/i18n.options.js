import locales from '../lib/locales';

/**
 * @type {import('@nuxt/schema').NuxtConfig['i18n']}
 */
export default {
  baseUrl: process.env.APPLI_APACHE_SERVERNAME,
  lazy: true,
  strategy: 'no_prefix',
  defaultLocale: 'fr',
  langDir: 'locales',
  locales,
  detectBrowserLanguage: {
    useCookie: true,
    cookieKey: 'ezmesure_i18n',
  },
};
