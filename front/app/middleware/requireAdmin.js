import { defineNuxtRouteMiddleware, useAuth, navigateTo } from '#imports';

/**
 * Checks if the user is an admin
 */
export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuth();
  if (user.value?.isAdmin) {
    return true;
  }
  return navigateTo('/myspace');
});
