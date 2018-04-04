<template>
  <v-container>
    <template v-if="user">
      <v-card class="mb-4">
        <v-toolbar card>
          <v-toolbar-title>Profil</v-toolbar-title>
          <v-spacer/>
          <v-tooltip left>
            <v-btn slot="activator" icon :href="refreshUrl">
              <v-icon>refresh</v-icon>
            </v-btn>
            <span>Actualiser</span>
          </v-tooltip>
        </v-toolbar>

        <v-card-text>
            <div class="mb-3">
              <div class="grey--text">Nom</div>
              <div>{{ user.full_name }}</div>
            </div>

            <div class="mb-3">
              <div class="grey--text">Mail</div>
              <div>{{ user.email }}</div>
            </div>

            <div class="mb-3">
              <div class="grey--text">IDP</div>
              <div>{{ metadata.idp }}</div>
            </div>

            <div class="mb-3">
              <div class="grey--text">Organisation</div>
              <div>{{ metadata.org }}</div>
            </div>

            <div class="mb-3">
              <div class="grey--text">Unité</div>
              <div>{{ metadata.unit }}</div>
            </div>
        </v-card-text>
      </v-card>

      <v-card class="mb-4">
        <v-toolbar card>
          <v-toolbar-title>Identifiants Kibana</v-toolbar-title>
        </v-toolbar>

        <v-card-text>
          <p>Ce nom d'utilisateur vous permet de vous connecter à l'interface Kibana afin d'accéder à vos tableaux de bord.</p>

          <v-text-field label="Nom d'utilisateur" v-model="user.username" readonly></v-text-field>

          <v-alert dismissible color="error" v-model="passwordError">{{ passwordErrorText }}</v-alert>
          <v-alert dismissible color="success" v-model="resetSuccess">Un nouveau mot de passe vous a été envoyé par mail.</v-alert>
          <p>Pour changer votre mot de passe, accédez à votre <a href="/kibana/app/kibana#/account">compte Kibana</a>.</p>
          <p>Mot de passe oublié ? <a href="javascript:void(0)" v-on:click="resetPassword">Cliquez-ici</a> pour le réinitialiser.</p>
        </v-card-text>
      </v-card>

      <FileList class="mb-4" />

      <v-card class="mb-4">
        <v-toolbar card>
          <v-toolbar-title>Token d'authentification</v-toolbar-title>
        </v-toolbar>

        <v-card-text>
          <p>Ce token est nécessaire pour utiliser l'API d'ezMESURE. Pour l'utiliser, ajoutez le header suivant à vos requêtes HTTP : <code>Authorization: Bearer {insérez le token ici}</code></p>

          <p class="text-xs-center">
            <v-btn v-if="!showToken" @click="showToken = true">
              <v-icon left>visibility</v-icon> Afficher mon token
            </v-btn>
          </p>

          <v-text-field v-if="showToken" label="Token" textarea v-model="token" readonly></v-text-field>
        </v-card-text>
      </v-card>
    </template>

    <v-card v-else>
      <v-card-text>
        <p>Vous n'êtes <strong>pas</strong> authentifié.</p>
        <p><a v-bind:href="redirectUrl">Cliquez ici</a> pour vous connecter.</p>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
  import FileList from '~/components/FileList'

  export default {
    components: {
      FileList
    },
    async fetch ({ store, redirect }) {
      await store.dispatch('auth/checkAuth')
      const user = store.state.auth.user

      if (user && !user.metadata.acceptedTerms) {
        redirect('/terms')
      }
    },
    data () {
      return {
        showToken: false,
        resetSuccess: false,
        passwordError: null,
        passwordErrorText: '',
        redirectUrl: `/login?origin=${encodeURIComponent(window.location.href)}`,
        refreshUrl: `/login?refresh=1&origin=${encodeURIComponent(window.location.href)}`
      }
    },
    computed: {
      user () { return this.$store.state.auth.user },
      metadata () { return (this.user && this.user.metadata) || {} },
      token () { return this.$store.state.auth.token }
    },
    methods: {
      async resetPassword () {
        this.passwordError = null
        this.resetSuccess = false

        try {
          await this.$store.dispatch('auth/resetPassword')
          this.resetSuccess = true
        } catch (e) {
          this.passwordError = true
          if (e.response.status >= 400 && e.response.status < 500) {
            this.passwordErrorText = e.response.body
          } else if (e.response.statusText) {
            this.passwordErrorText = e.response.statusText
          } else {
            this.passwordErrorText = e.message
          }
        }
      }
    }
  }
</script>
