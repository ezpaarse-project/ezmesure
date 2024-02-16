/* eslint-disable import/no-extraneous-dependencies */
import colors from 'vuetify/lib/util/colors';

export default ({ app }) => ({
  lang: {
    t: (key, ...params) => app.i18n.t(key, params),
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
});
