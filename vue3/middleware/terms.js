import { defineNuxtRouteMiddleware, useAuthState, navigateTo } from '#imports';

export default defineNuxtRouteMiddleware(() => {
  const { data: user } = useAuthState();
  if (user.value?.metadata?.acceptedTerms) {
    return true;
  }
  return navigateTo('/myspace');
});
