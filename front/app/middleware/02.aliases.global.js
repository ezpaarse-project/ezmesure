import {
  defineNuxtRouteMiddleware,
  setPageLayout,
} from '#imports';

import adminMiddleware from './admin';

const ADMIN_PATH_REGEX = /^\/admin/;

/**
 * Change the layout to 'admin' if the route is an alias of '/admin'
 */
export default defineNuxtRouteMiddleware((route, from) => {
  const matched = route.matched.at(0);
  if (!matched || route.meta.layout === 'admin') {
    return true;
  }

  if (!matched.aliasOf || !ADMIN_PATH_REGEX.test(route.path)) {
    return true;
  }

  setPageLayout('admin');
  return adminMiddleware(route, from);
});
