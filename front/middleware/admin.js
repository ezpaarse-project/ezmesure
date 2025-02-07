import { defineNuxtRouteMiddleware, useAuthState, navigateTo } from '#imports';

/**
 * Checks if the user is an admin
 */
export default defineNuxtRouteMiddleware(() => {
  const { data: user } = useAuthState();
  if (user.value?.isAdmin) {
    return true;
  }
  return navigateTo('/myspace');
});
