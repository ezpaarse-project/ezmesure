import {
  defineNuxtRouteMiddleware,
  useAuthStore,
  storeToRefs,
  navigateTo,
} from '#imports';

/**
 * Checks if the user is an admin
 */
export default defineNuxtRouteMiddleware(() => {
  const { user } = storeToRefs(useAuthStore());
  if (user.value?.isAdmin) {
    return true;
  }
  return navigateTo('/myspace');
});
