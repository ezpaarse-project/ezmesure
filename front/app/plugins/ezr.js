import ezreeportVue from '@ezpaarse-project/ezreeport-vue';

import { defineNuxtPlugin, useSnacksStore } from '#imports';

export default defineNuxtPlugin((nuxtApp) => {
  const snacks = useSnacksStore();

  nuxtApp.hook('vuetify:ready', () => {
    // Setup ezreeport components
    nuxtApp.vueApp.use(ezreeportVue, {
      locale: {
        i18n: nuxtApp.$i18n,
        namespaces: {
          label: '@:institutions.title',
        },
      },
      errorHandler: (message, err) => {
        snacks.error(message, err);
      },
    });
  });
});
