import locales from '../app/lib/locales';

/**
 * @type {import('@nuxt/schema').NuxtConfig['i18n']}
 */
export default {
  strategy: 'no_prefix',
  defaultLocale: 'fr',
  langDir: 'locales',
  locales,
  detectBrowserLanguage: {
    useCookie: true,
    cookieKey: 'ezmesure_i18n',
  },
};
