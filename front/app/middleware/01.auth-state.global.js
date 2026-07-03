import {
  defineNuxtRouteMiddleware,
  useAuthStore,
  storeToRefs,
} from '#imports';

/**
 * Refresh auth session if needed
 */
export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore();
  const { isAuthenticated } = storeToRefs(authStore);
  if (!isAuthenticated.value) {
    await authStore.refreshAuthenticatedUser({ confirmOnError: false });
  }
  return true;
});
