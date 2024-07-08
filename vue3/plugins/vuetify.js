import { defineNuxtPlugin, useI18n } from '#imports';
import { createVuetify } from 'vuetify';

/* eslint-disable import/no-unresolved */
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n';
import { fr, en } from 'vuetify/locale';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import colors from 'vuetify/util/colors';
/* eslint-enable import/no-unresolved */

const I18N_KEY = '__VUE_I18N__';

export default defineNuxtPlugin((nuxtApp) => {
  // Merge Vuetify messages with i18n
  const i18n = nuxtApp.vueApp[I18N_KEY];
  i18n.global.mergeLocaleMessage('en', { $vuetify: en });
  i18n.global.mergeLocaleMessage('fr', { $vuetify: fr });

  // Setup Vuetify
  nuxtApp.vueApp.use(
    createVuetify({
      ssr: true,
      components,
      directives,
      locale: {
        adapter: createVueI18nAdapter({
          i18n,
          useI18n,
        }),
      },
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
    }),
  );
});
