import { defineNuxtRouteMiddleware, setPageLayout, addRouteMiddleware } from '#imports';

const ADMIN_PATH_REGEX = /^\/admin/;

/**
 * Change the layout to 'admin' if the route is an alias of '/admin'
 */
export default defineNuxtRouteMiddleware((route) => {
  if (!route.meta.alias || route.meta.layout === 'admin') {
    return true;
  }

  const aliases = Array.isArray(route.meta.alias) ? route.meta.alias : [route.meta.alias];
  const hasAdminAlias = (aliases ?? []).some((alias) => ADMIN_PATH_REGEX.test(alias));
  if (!hasAdminAlias || !ADMIN_PATH_REGEX.test(route.path)) {
    return true;
  }

  setPageLayout('admin');
  addRouteMiddleware('admin');
  return true;
});
