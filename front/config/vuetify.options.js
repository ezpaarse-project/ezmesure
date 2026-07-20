/* eslint-disable import/no-unresolved */
import colors from 'vuetify/util/colors';

/**
 * @type {import('vuetify-nuxt-module').ModuleOptions}
 */
export default {
  moduleOptions: {
    prefixComposables: true,
  },

  vuetifyOptions: {
    directives: true,

    theme: {
      defaultTheme: 'light',

      themes: {
        light: {
          dark: false,
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
