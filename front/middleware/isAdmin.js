export default function isAdmin({ $auth, redirect }) {
  if ($auth?.user?.isAdmin) {
    return true;
  }
  return redirect('/myspace');
}
