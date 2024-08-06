import { defineNuxtRouteMiddleware, useAuthState, navigateTo } from '#imports';

/**
 * Checks if the user has accepted the terms of service.
 */
export default defineNuxtRouteMiddleware(() => {
  const { data: user } = useAuthState();
  if (user.value?.metadata?.acceptedTerms) {
    return true;
  }
  return navigateTo('/myspace');
});
