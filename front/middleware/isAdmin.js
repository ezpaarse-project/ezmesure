export default function ({ $auth, redirect }) {
  const roles = new Set(($auth.user && $auth.user.roles) || []);

  if (!roles.has('admin') && !roles.has('superuser')) {
    return redirect('/myspace');
  }
  return true;
}
