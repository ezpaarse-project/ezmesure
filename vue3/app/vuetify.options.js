/* eslint-disable import/no-unresolved */
import colors from 'vuetify/util/colors';
/* eslint-enable import/no-unresolved */

/**
 * @type {import('vuetify-nuxt-module').ModuleOptions}
 */
export default {
  vuetifyOptions: {
    ssr: true,

    labComponents: ['VTreeview'],
    directives: true,

    theme: {
      themes: {
        light: {
          colors: {
            primary: colors.purple.base,
            secondary: colors.grey.darken2,
            accent: colors.lightBlue.base,
          },
        },
      },
    },
  },
};
