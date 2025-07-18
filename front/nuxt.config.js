import { defineNuxtConfig } from 'nuxt/config';

import authOptions from './config/auth.options';
import i18nOptions from './config/i18n.options';
import vuetifyOptions from './config/vuetify.options';

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
        protocol: 'ws',
        clientPort: 8080,
      },
    },
    // Prevent Vite from optimizing ezreeport in dev, allowing to replace it with a local version
    optimizeDeps: process.env.NODE_ENV !== 'production' ? { exclude: ['@ezpaarse-project/ezreeport-vue'] } : undefined,
  },
});
