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
          <input v-model="auth.user.metadata.idp" type="text" class="form-control" id="idp" placeholder="IDP" readonly>
        </div>
        <div class="form-group">
          <label for="name">Nom</label>
          <input v-model="auth.user.full_name" type="text" class="form-control" id="name" placeholder="Nom" readonly>
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input v-model="auth.user.email" type="email" class="form-control" id="email" placeholder="Email" readonly>
        </div>
        <div class="form-group">
          <label for="org">Organisation</label>
          <input v-model="auth.user.metadata.org" type="text" class="form-control" id="org" placeholder="Organisation" readonly>
        </div>
        <div class="form-group">
          <label for="unit">Unité</label>
          <input v-model="auth.user.metadata.unit" type="text" class="form-control" id="unit" placeholder="Unité" readonly>
        </div>
      </form>

      <h2>Token</h2>
      <p>Ce token est nécessaire pour utiliser l'API d'ezMESURE. Pour l'utiliser, ajoutez le header suivant à vos requêtes : <code>Authorization: Bearer {insérez le token ici}</code></p>
      <textarea class="form-control" rows="3" v-model="auth.token" placeholder="Token" readonly></textarea>

      <h2>Identifiants Kibana</h2>
      <div class="form-group">
        <label for="idp">Nom d'utilisateur</label>
        <input v-model="auth.user.username" type="text" class="form-control" id="kibana-id" placeholder="Identifiant Kibana" readonly>
      </div>

      <h3>Mot de passe</h3>

      <p class="bg-danger" v-if="passwordError" v-text="passwordError"></p>
      <p class="bg-success" v-if="passwordSuccess">Mot de passe mis à jour.</p>
      <p class="bg-success" v-if="resetSuccess">Un nouveau mot de passe vous a été envoyé par mail.</p>

      <form v-on:submit.prevent="updatePassword">
        <div class="form-group">
          <label for="unit">Mot de passe actuel</label>
          <input type="password" v-model="currentPassword" class="form-control" placeholder="Mot de passe actuel">
        </div>
        <div class="form-group">
          <label for="unit">Nouveau mot de passe</label>
          <input type="password" v-model="newPassword" class="form-control" placeholder="Nouveau mot de passe">
        </div>
        <div class="form-group">
          <label for="unit">Confirmation mot de passe</label>
          <input type="password" v-model="confirmPassword" class="form-control" placeholder="Confirmation mot de passe">
        </div>
        <input class="btn btn-default" type="submit" value="Mettre à jour">
      </form>
      <p>Mot de passe oublié ? <a href="javascript:void(0)" v-on:click="resetPassword">Cliquez-ici</a> pour le réinitialiser.</p>
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
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        resetSuccess: false,
        passwordSuccess: false,
        passwordError: null,
        auth,
        redirectUrl: `/login?origin=${encodeURIComponent(window.location.href)}`,
        refreshUrl: `/login?refresh=1&origin=${encodeURIComponent(window.location.href)}`
      }
    },
    methods: {
      updatePassword () {
        this.passwordError = null
        this.passwordSuccess = false

        auth.updatePassword({
          currentPassword: this.currentPassword,
          newPassword: this.newPassword,
          confirmPassword: this.confirmPassword
        })
        .then(() => { this.passwordSuccess = true })
        .catch((e) => {
          if (e.status >= 400 && e.status < 500) {
            return this.passwordError = e.body
          }
          this.passwordError = e.statusText
        });
      },
      resetPassword () {
        this.passwordError = null
        this.resetSuccess = false

        auth.resetPassword()
        .then(() => { this.resetSuccess = true })
        .catch((e) => {
          if (e.status >= 400 && e.status < 500) {
            return this.passwordError = e.body
          }
          this.passwordError = e.statusText
        });
      }
    }
  }
</script>
