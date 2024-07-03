// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      environment: process.env.NODE_ENV || 'development',
      version: process.env.VERSION || 'development',
      APIHost: process.env.API_HOST || 'https://api.github.com/',
      githubProfileURL: process.env.GITHUB_PROFILE_URL || 'https://github.com/felixleo22',
    }
  },
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxtjs/i18n'],
  build: {
    transpile: ['vuetify'],
  },
  i18n: {
    vueI18n: './config/i18n.js'
  },
  plugins: [
    '~/plugins/api',
    '~/plugins/vuetify'
  ],
  css: [
    'vuetify/lib/styles/main.sass',
    '@mdi/font/css/materialdesignicons.min.css',
  ],
})
