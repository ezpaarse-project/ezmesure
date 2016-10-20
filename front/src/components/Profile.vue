<template>
  <div>
    <div class="page-header">
        <h1>Profil</h1>
    </div>

    <div v-if="auth.user">
      <form>
        <div class="form-group">
          <label for="idp">IDP</label>
          <input v-model="auth.user.idp" type="text" class="form-control" id="idp" placeholder="IDP" readonly>
        </div>
        <div class="form-group">
          <label for="username">Nom</label>
          <input v-model="auth.user.username" type="text" class="form-control" id="username" placeholder="Nom">
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input v-model="auth.user.mail" type="email" class="form-control" id="email" placeholder="Email">
        </div>
        <div class="form-group">
          <label for="org">Organisation</label>
          <input v-model="auth.user.org" type="text" class="form-control" id="org" placeholder="Organisation">
        </div>
      </form>
    </div>

    <div v-else>
      <p>Vous n'êtes <strong>pas</strong> authentifié.</p>
      <p><a v-bind:href="redirectUrl">Cliquez ici</a> pour vous connecter.</p>
    </div>
  </div>
</template>

<script>
  import auth from '../auth'

  export default {
    data() {
      return {
        auth,
        redirectUrl: `/login?origin=${encodeURIComponent(window.location.href)}`
      }
    }
  }
</script>
