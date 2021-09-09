export default function ({ $auth, redirect }) {
  const acceptedTerms = $auth.user && $auth.user.metadata && $auth.user.metadata.acceptedTerms;

  if (!acceptedTerms) {
    redirect('/activation');
  }
}
