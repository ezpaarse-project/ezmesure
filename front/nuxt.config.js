const path = require('path');

module.exports = {
  /*
  ** Headers of the page
  */
  head: {
    title: 'ezMESURE - Plateforme des tableaux de bord ezPAARSE de l’ESR',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'ezMESURE est un entrepôt national centralisant les statistiques d’usage de la documentation scientifique numérique des établissements de l’enseignement supérieur et de la recherche (ESR). ezMESURE aggrege les données produites par les installations ezPAARSE des établissements de l’ESR.' },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    ],
  },

  plugins: [
    { src: '~/plugins/dates.js' },
    { src: '~/plugins/ezreeport.js' },
  ],

  css: [
    'swagger-ui/dist/swagger-ui.css',
    '~/assets/css/custom.css',
  ],

  ssr: false,
  telemetry: false,

  publicRuntimeConfig: {
    shibbolethEnabled: !process.env.EZMESURE_DISABLE_SHIBBOLETH,
    supportMail: process.env.EZMESURE_SUPPORT_MAIL || 'ezteam@couperin.org',
    currentInstance: process.env.EZMESURE_INSTANCE,
  },

  modules: [
    [
      '@nuxtjs/proxy',
      {
        pathRewrite: {
          '/api': process.env.API_URL,
        },
      },
    ],
    [
      '@nuxtjs/axios',
      {
        prefix: '/api',
        credentials: true,
        proxy: true,
      },
    ],
    '@nuxtjs/i18n',
    '~/modules/vuetify-locales',
  ],

  buildModules: [
    '@nuxtjs/auth',
    [
      '@nuxtjs/vuetify',
      { optionsPath: './vuetify.options.js' },
    ],
  ],

  i18n: {
    baseUrl: process.env.APPLI_APACHE_SERVERNAME,
    vueI18nLoader: true,
    locales: [
      {
        name: 'Français',
        code: 'fr',
        iso: 'fr-FR',
        file: 'fr.json',
      },
      {
        name: 'English',
        code: 'en',
        iso: 'en-US',
        file: 'en.json',
      },
    ],
    defaultLocale: 'fr',
    lazy: true,
    langDir: 'locales/',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'ezmesure_i18n',
      redirectOn: 'all',
      alwaysRedirect: true,
      fallbackLocale: 'en',
    },
  },

  auth: {
    scopeKey: 'roles',
    redirect: {
      login: '/authenticate',
      logout: '/',
      home: '/',
    },
    fullPathRedirect: false,
    strategies: {
      local: {
        tokenRequired: false,
        endpoints: {
          login: { url: '/login/local', method: 'post', propertyName: false },
          logout: { url: '/logout', method: 'get' },
          user: { url: '/profile', method: 'get', propertyName: false },
        },
      },
    },
  },

  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#3B8070' },
  loadingIndicator: {
    name: 'folding-cube',
    color: '#9c27b0',
  },

  pageTransition: 'fade-transition',

  router: {
    extendRoutes(routes, resolve) {
      routes.push(
        // Route aliases
        {
          name: 'admin-institution-id-sushi',
          path: '/admin/institutions/:id/sushi',
          component: resolve(__dirname, 'pages/myspace/institutions/_id/sushi.vue'),
        },
        {
          name: 'admin-institution-id-members',
          path: '/admin/institutions/:id/members',
          component: resolve(__dirname, 'pages/myspace/institutions/_id/members.vue'),
        },
        {
          name: 'admin-institution-id-reports',
          path: '/admin/institutions/:id/reports',
          component: resolve(__dirname, 'pages/myspace/institutions/_id/reports.vue'),
        },
        {
          name: 'admin-root',
          path: '/admin',
          redirect: '/admin/institutions',
        },
        // Legacy routes
        {
          name: 'legacy-institutions',
          path: '/institutions',
          redirect: '/admin/institutions',
        },
        {
          name: 'legacy-institutions-id',
          path: '/institutions/:id',
          redirect: '/admin/institutions/:id',
        },
        {
          name: 'legacy-my-institutions',
          path: '/my-institutions',
          redirect: '/myspace/institutions',
        },
        {
          name: 'legacy-institutions-id-sub',
          path: '/institutions/:id/*',
          redirect: (to) => `/myspace${to.path}`,
        },
        {
          name: 'legacy-files',
          path: '/files',
          redirect: '/myspace/files',
        },
        {
          name: 'legacy-kibana',
          path: '/kibana',
          redirect: '/myspace/kibana',
        },
        {
          name: 'legacy-token',
          path: '/token',
          redirect: '/myspace/token',
        },
      );
    },
  },

  /*
  ** Build configuration
  */
  build: {
    extractCSS: true,
    /*
    ** Run ESLINT on save
    */
    extend(config, ctx) {
      // https://github.com/vuetifyjs/vuetify/discussions/4068#discussioncomment-24984
      config.resolve.alias.vue$ = path.resolve(__dirname, 'node_modules/vue/dist/vue.runtime.esm.js');
      config.resolve.alias['^vuetify'] = path.resolve(__dirname, 'node_modules/vuetify');

      if (ctx.isDev && ctx.isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/,
        });
      }
    },
  },
};
