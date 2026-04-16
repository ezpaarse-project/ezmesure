import { defineNuxtRouteMiddleware, useAuth, navigateTo } from '#imports';

/**
 * Checks if the user has accepted the terms of service.
 */
export default defineNuxtRouteMiddleware(() => {
  const { user } = useAuth();
  if (user.value?.metadata?.acceptedTerms) {
    return true;
  }
  return navigateTo('/activate');
});
