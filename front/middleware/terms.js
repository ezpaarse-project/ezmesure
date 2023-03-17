export default function hasAcceptedTerms({ $auth, redirect }) {
  if (!$auth?.user?.metadata?.acceptedTerms) {
    redirect('/activation');
  }
}
