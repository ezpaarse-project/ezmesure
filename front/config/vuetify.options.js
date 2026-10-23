import colors from 'vuetify/util/colors';
import { allAliases } from '../app/lib/icons';

/**
 * @type {import('vuetify-nuxt-module').ModuleOptions}
 */
export default {
  moduleOptions: {
    prefixComposables: true,
  },

  vuetifyOptions: {
    directives: true,

    icons: {
      defaultSet: 'mdi-svg',
      svg: {
        mdi: {
          // adding quotes as nuxt-vuetify will forget to add them
          aliases: Object.fromEntries(allAliases.map(([name, icon]) => [`'${name}'`, icon])),
        },
      },
    },

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
