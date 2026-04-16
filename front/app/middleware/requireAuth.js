import {
  defineNuxtRouteMiddleware,
  useAuth,
  navigateTo,
} from '#imports';

/**
 * Refresh auth session if needed
 */
export default defineNuxtRouteMiddleware((ctx) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated.value) {
    return true;
  }
  return navigateTo({ path: '/authenticate', query: { redirect: ctx.path } });
});
