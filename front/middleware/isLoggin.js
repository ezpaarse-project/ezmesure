export default function ({ store, route, redirect }) {
  const { user } = store.state.auth;

  if (!user) {
    return redirect('/authenticate', { origin: route.fullPath });
  }
  if (user && !user.metadata.acceptedTerms) {
    return redirect('/terms');
  }
  return true;
}
