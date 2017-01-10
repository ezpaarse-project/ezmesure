<template>
  <div>
    <div class="page-header">
      <h1>Profil</h1>
    </div>

    <div v-if="auth.user">
      <p><a v-bind:href="refreshUrl">Cliquez ici</a> pour actualiser votre profil.</p>

      <form>
        <div class="form-group">
          <label for="idp">IDP</label>
          <input v-model="auth.user.idp" type="text" class="form-control" id="idp" placeholder="IDP" readonly>
        </div>
        <div class="form-group">
          <label for="name">Nom</label>
          <input v-model="auth.user.name" type="text" class="form-control" id="name" placeholder="Nom" readonly>
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input v-model="auth.user.mail" type="email" class="form-control" id="email" placeholder="Email" readonly>
        </div>
        <div class="form-group">
          <label for="org">Organisation</label>
          <input v-model="auth.user.org" type="text" class="form-control" id="org" placeholder="Organisation" readonly>
        </div>
        <div class="form-group">
          <label for="unit">Unité</label>
          <input v-model="auth.user.unit" type="text" class="form-control" id="unit" placeholder="Unité" readonly>
        </div>
      </form>

      <h2>Token</h2>
      <p>Ce token est nécessaire pour utiliser l'API d'ezMESURE. Pour l'utiliser, ajoutez le header suivant à vos requêtes : <code>Authorization: Bearer {insérez le token ici}</code></p>
      <textarea class="form-control" rows="3" v-model="auth.token" placeholder="Token" readonly></textarea>
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
        redirectUrl: `/login?origin=${encodeURIComponent(window.location.href)}`,
        refreshUrl: `/login?refresh=1&origin=${encodeURIComponent(window.location.href)}`
      }
    }
  }
</script>
