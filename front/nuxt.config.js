import { defineNuxtConfig } from 'nuxt/config';

import i18nOptions from './config/i18n.options';
import vuetifyOptions from './config/vuetify.options';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      currentInstance: '',
      oidcProfileUri: '',
      counterRegistryUrl: 'https://registry.countermetrics.org',
    },
  },

  modules: [
    '@nuxtjs/i18n',
    'vuetify-nuxt-module',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

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

  vite: {
    // Prevent Vite from optimizing ezreeport in dev, allowing to replace it with a local version
    optimizeDeps: process.env.NODE_ENV !== 'production' ? { exclude: ['@ezpaarse-project/ezreeport-vue'] } : undefined,
  },
});
