/**
 * @type {import('@nuxt/schema').RouterConfig}
 */
export default {
  // https://router.vuejs.org/api/interfaces/routeroptions.html#routes
  routes: (routes) => [
    ...routes,
    {
      name: 'admin',
      path: '/admin/',
      redirect: '/admin/institutions',
    },
  ],
};
