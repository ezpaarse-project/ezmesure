import { defineNuxtPlugin, useAuthStore } from '#imports';

export default defineNuxtPlugin((nuxtApp) => {
  const { bus } = useAuthStore();

  bus.on((event, payload) => {
    if (event !== 'login') {
      return;
    }

    if (payload.language && payload.language !== nuxtApp.$i18n.locale.value) {
      nuxtApp.$i18n.setLocale(payload.language);
    }
  });
});
