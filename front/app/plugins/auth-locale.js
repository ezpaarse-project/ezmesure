import { whenever } from '@vueuse/core';
import { defineNuxtPlugin, useAuth } from '#imports';

export default defineNuxtPlugin((nuxtApp) => {
  const { data } = useAuth();

  /**
   * Workaround to set locale when user is logged in, since nuxt-auth has no hook for it
   * @see https://github.com/sidebase/nuxt-auth/issues/964
   */
  whenever(data, (userData) => {
    if (userData.language && userData.language !== nuxtApp.$i18n.locale.value) {
      nuxtApp.$i18n.setLocale(userData.language);
    }
  }, { once: true });
});
