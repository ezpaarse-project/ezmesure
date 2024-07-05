export default defineNuxtRouteMiddleware(() => {
  const { data: user } = useAuthState();
  if (user.value?.isAdmin) {
    return true;
  }
  return navigateTo('/myspace');
});
