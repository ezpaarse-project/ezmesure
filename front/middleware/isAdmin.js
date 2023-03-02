export default function ({ $auth, redirect }) {
  if ($auth?.user?.isAdmin) {
    return true;
  }
  return redirect('/myspace');
}
