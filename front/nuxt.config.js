import colors from 'vuetify/lib/util/colors';
import fr from 'vuetify/lib/locale/fr';

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
  ],
  mode: 'spa',
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
  ],
  devModules: [
    ['@nuxtjs/vuetify', {
      lang: {
        locales: { fr },
        current: 'fr',
      },
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
