import { defineNuxtPlugin } from '#imports';

/* eslint-disable import/no-unresolved */
import { fr, en } from 'vuetify/locale';
/* eslint-enable import/no-unresolved */

const I18N_KEY = '__VUE_I18N__';

export default defineNuxtPlugin((nuxtApp) => {
  // Merge Vuetify messages with i18n
  const i18n = nuxtApp.vueApp[I18N_KEY];
  i18n.global.mergeLocaleMessage('en', { $vuetify: en });
  i18n.global.mergeLocaleMessage('fr', { $vuetify: fr });
});
