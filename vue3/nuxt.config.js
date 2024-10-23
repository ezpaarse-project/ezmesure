import { defineNuxtConfig } from 'nuxt/config';

import authOptions from './app/auth.options';
import i18nOptions from './app/i18n.options';
import vuetifyOptions from './app/vuetify.options';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      shibbolethDisabled: false,
      supportMail: 'ezteam@couperin.org',
      currentInstance: '',
    },
  },

  modules: [
    '@nuxtjs/i18n',
    'vuetify-nuxt-module',
    '@pinia/nuxt',
    '@sidebase/nuxt-auth',
    '@vueuse/nuxt',
  ],

  i18n: i18nOptions,

  pinia: {
    storesDirs: ['./store/**'],
  },

  auth: authOptions,

  vuetify: vuetifyOptions,

  // pageTransition: 'fade-transition',
  // loading: { color: '#3B8070' },
  // loadingIndicator: {
  //   name: 'folding-cube',
  //   color: '#9c27b0',
  // },

  ssr: false,
  telemetry: false,

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
