import { createVuetify } from 'vuetify';
// eslint-disable-next-line import/no-unresolved
import * as components from 'vuetify/components';
// eslint-disable-next-line import/no-unresolved
import * as directives from 'vuetify/directives';
// eslint-disable-next-line import/no-unresolved
import colors from 'vuetify/util/colors';

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    ssr: true,
    components,
    directives,
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
  });

  nuxtApp.vueApp.use(vuetify);
});
