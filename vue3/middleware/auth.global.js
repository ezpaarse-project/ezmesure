import { defineNuxtRouteMiddleware, useAuth } from '#imports';

/**
 * Refresh auth session if needed
 */
export default defineNuxtRouteMiddleware(async () => {
  const { getSession, status } = useAuth();
  if (status.value === 'unauthenticated') {
    await getSession({ force: true }).catch(() => {});
  }
  return true;
});
