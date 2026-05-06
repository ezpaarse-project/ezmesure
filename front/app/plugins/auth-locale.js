import { defineNuxtPlugin, useAuth } from '#imports';

export default defineNuxtPlugin((nuxtApp) => {
  const { bus } = useAuth();

  bus.on((event, payload) => {
    if (event !== 'login') {
      return;
    }

    if (payload.language && payload.language !== nuxtApp.$i18n.locale.value) {
      nuxtApp.$i18n.setLocale(payload.language);
    }
  });
});
