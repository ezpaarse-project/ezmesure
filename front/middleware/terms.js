export default function ({ $auth, redirect }) {
  if (!$auth?.user?.metadata?.acceptedTerms) {
    redirect('/activation');
  }
}
