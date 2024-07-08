import { defineNuxtConfig } from 'nuxt/config';
import locales from './lib/locales';

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

  i18n: {
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
  },

  pinia: {
    storesDirs: ['./store/**'],
  },

  auth: {
    baseURL: '/api/',
    provider: {
      type: 'local',
      endpoints: {
        signIn: { path: '/login/local', method: 'post' },
        signOut: { path: '/logout', method: 'get' },
        getSession: { path: '/profile', method: 'get' },
      },
      token: {
        cookieName: 'eztoken',
      },
      sessionDataType: {
        username: 'string',
        fullName: 'string',
        email: 'string',
        createdAt: 'string',
        updatedAt: 'string',
        isAdmin: 'boolean',
        metadata: '{ acceptedTerms?: boolean }?',
      },
      pages: {
        login: '/authenticate',
      },
    },
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
