import locales from './config/locales';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      shibbolethEnabled: !process.env.EZMESURE_DISABLE_SHIBBOLETH,
      supportMail: process.env.EZMESURE_SUPPORT_MAIL || 'ezteam@couperin.org',
      currentInstance: process.env.EZMESURE_INSTANCE,
    },
  },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',
  ],

  plugins: [
    '~/plugins/vuetify',
  ],

  i18n: {
    strategy: 'no_prefix',
    lazy: true,
    defaultLocale: 'fr',
    langDir: 'locales',
    locales,
  },

  css: [
    'vuetify/lib/styles/main.sass',
    '@mdi/font/css/materialdesignicons.min.css',
  ],

  // pageTransition: 'fade-transition',
  // loading: { color: '#3B8070' },
  // loadingIndicator: {
  //   name: 'folding-cube',
  //   color: '#9c27b0',
  // },

  ssr: false,
  telemetry: false,

  build: {
    transpile: ['vuetify'],
  },

  devtools: {
    enabled: true,
  },
});
