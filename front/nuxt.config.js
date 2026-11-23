import { defineNuxtConfig } from 'nuxt/config';

import i18nOptions from './config/i18n.options';
import vuetifyOptions from './config/vuetify.options';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  routeRules: {
    '/admin/**': { appLayout: 'admin', appMiddleware: ['require-auth', 'require-terms', 'require-admin'] },
    '/myspace/**': { appLayout: 'space', appMiddleware: ['require-auth', 'require-terms'] },
  },

  modules: ['@nuxtjs/i18n', 'vuetify-nuxt-module', '@pinia/nuxt', '@vueuse/nuxt', '@nuxt/fonts'],

  i18n: i18nOptions,

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

  fonts: {
    weights: ['100 900'],
  },
});
