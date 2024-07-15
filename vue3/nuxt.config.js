import { defineNuxtConfig } from 'nuxt/config';

import routerOptions from './app/router.options';
import authOptions from './app/auth.options';
import i18nOptions from './app/i18n.options';

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
    '@sidebase/nuxt-auth',
  ],

  plugins: [
    '~/plugins/vuetify',
  ],

  router: {
    options: routerOptions,
  },

  i18n: i18nOptions,

  pinia: {
    storesDirs: ['./store/**'],
  },

  auth: authOptions,

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

  devServer: {
    host: '0.0.0.0',
    port: 8080,
  },

  vite: {
    server: {
      hmr: {
        clientPort: 8080,
      },
    },
  },
});
