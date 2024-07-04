// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      shibbolethEnabled: !process.env.EZMESURE_DISABLE_SHIBBOLETH,
      supportMail: process.env.EZMESURE_SUPPORT_MAIL || 'ezteam@couperin.org',
      currentInstance: process.env.EZMESURE_INSTANCE,}
  },
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@nuxt/eslint'
  ],
  build: {
    transpile: ['vuetify'],
  },
  i18n: {
    vueI18n: './config/i18n.ts'
  },
  plugins: [
    '~/plugins/vuetify'
  ],
  css: [
    'vuetify/lib/styles/main.sass',
    '@mdi/font/css/materialdesignicons.min.css',
  ],
})
