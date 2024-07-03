import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import colors from 'vuetify/lib/util/colors'

export default defineNuxtPlugin(nuxtApp => {
  const vuetify = createVuetify({
    ssr: true,
    components,
    directives,
    theme: {
      themes: {
        light: {
          colors: {
            primary: colors.blue.darken1,
            secondary: colors.grey.darken4,
            secondary: colors.grey.darken4,
          }
        },
        dark: {
          colors: {
            primary: colors.blue.darken1,
            accent: colors.grey.darken3,
            secondary: colors.grey.darken3,
          }
        }
      }
    }
  })

  nuxtApp.vueApp.use(vuetify)
})