module.exports = {
  /*
  ** Headers of the page
  */
  head: {
    title: 'ezmesure-front',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'ezmesure front' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons' }
    ]
  },
  plugins: ['~/plugins/vuetify.js'],
  css: [
    '~/assets/style/app.styl'
  ],
  mode: 'spa',
  modules: [
    ['@nuxtjs/axios', {
      prefix: '/api',
      credentials: true
    }]
  ],
  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#3B8070' },
  loadingIndicator: {
    name: 'folding-cube',
    color: '#E10D1A'
  },
  /*
  ** Build configuration
  */
  build: {
    vendor: ['vuetify'],
    extractCSS: true,
    /*
    ** Run ESLINT on save
    */
    extend (config, ctx) {
      if (ctx.dev && ctx.isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }
    }
  }
}
