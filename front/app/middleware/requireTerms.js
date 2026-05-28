import {
  defineNuxtRouteMiddleware,
  useAuthStore,
  storeToRefs,
  navigateTo,
} from '#imports';

/**
 * Checks if the user has accepted the terms of service.
 */
export default defineNuxtRouteMiddleware(() => {
  const { user } = storeToRefs(useAuthStore());
  if (user.value?.metadata?.acceptedTerms) {
    return true;
  }
  return navigateTo('/activate');
});
