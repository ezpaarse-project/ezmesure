import colors from 'vuetify/lib/util/colors';

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
  plugins: [],
  css: [
    'swagger-ui/dist/swagger-ui.css',
    '~/assets/css/custom.scss',
  ],
  mode: 'spa',
  env: {
    shibbolethEnabled: !process.env.EZMESURE_DISABLE_SHIBBOLETH,
  },
  modules: [
    ['@nuxtjs/proxy', {
      pathRewrite: {
        '/api': process.env.API_URL,
      },
    }],
    ['@nuxtjs/axios', {
      prefix: '/api',
      credentials: true,
      proxy: true,
    }],
    'nuxt-i18n',
  ],
  i18n: {
    baseUrl: process.env.APPLI_APACHE_SERVERNAME,
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
    seo: true,
    lazy: true,
    langDir: 'locales/',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'ezmesure_i18n',
      alwaysRedirect: true,
      fallbackLocale: 'en',
    },
  },
  devModules: [
    '@nuxtjs/auth',
    ['@nuxtjs/vuetify', {
      theme: {
        themes: {
          light: {
            primary: colors.purple,
            secondary: colors.grey.darken2,
            accent: colors.lightBlue,
          },
        },
      },
    }],
  ],
  auth: {
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
  /*
  ** Build configuration
  */
  build: {
    extractCSS: true,
    /*
    ** Run ESLINT on save
    */
    extend(config, ctx) {
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
