export default function ({ store, route, redirect }) {
  const { user } = store.state.auth;

  if (!user) {
    return redirect('/authenticate', { origin: route.fullPath });
  }
  if (user && !user.roles.length) {
    return redirect('/myspace');
  }

  const isAdmin = user.roles.some(role => ['admin', 'superuser'].includes(role));
  if (!isAdmin) {
    return redirect('/myspace');
  }
  return true;
}
