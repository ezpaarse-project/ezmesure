import { defineNuxtRouteMiddleware, useAuth } from '#imports';

export default defineNuxtRouteMiddleware(async () => {
  const { getSession, status } = useAuth();
  if (status.value === 'unauthenticated') {
    await getSession({ force: true }).catch(() => {});
  }
  return true;
});
