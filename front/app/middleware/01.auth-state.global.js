import {
  defineNuxtRouteMiddleware,
  useAuth,
} from '#imports';

/**
 * Refresh auth session if needed
 */
export default defineNuxtRouteMiddleware(async () => {
  const { isAuthenticated, refreshAuthenticatedUser } = useAuth();
  if (!isAuthenticated.value) {
    await refreshAuthenticatedUser();
  }
  return true;
});
