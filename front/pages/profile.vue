<template>
  <v-container>
    <template v-if="user">
      <v-card class="mb-4">
        <v-toolbar card>
          <v-toolbar-title>Profil</v-toolbar-title>
          <v-spacer/>
          <v-btn flat :href="refreshUrl">
            Actualiser
          </v-btn>
        </v-toolbar>
<!--
        <v-list two-line>
          <v-list-tile>
            <v-list-tile-content>
              <v-list-tile-title>{{ user.full_name }}</v-list-tile-title>
              <v-list-tile-sub-title>{{ user.email }}</v-list-tile-sub-title>
            </v-list-tile-content>
          </v-list-tile>

          <v-list-tile>
            <v-list-tile-content>
              <v-list-tile-title>{{ user.metadata.idp }}</v-list-tile-title>
              <v-list-tile-sub-title>IDP</v-list-tile-sub-title>
            </v-list-tile-content>
          </v-list-tile>

          <v-list-tile>
            <v-list-tile-content>
              <v-list-tile-title>{{ user.metadata.org }}</v-list-tile-title>
              <v-list-tile-sub-title>Organisation</v-list-tile-sub-title>
            </v-list-tile-content>
          </v-list-tile>

          <v-list-tile>
            <v-list-tile-content>
              <v-list-tile-title>{{ user.metadata.unit }}</v-list-tile-title>
              <v-list-tile-sub-title>Unité</v-list-tile-sub-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list> -->

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
              <div>{{ user.metadata.idp }}</div>
            </div>

            <div class="mb-3">
              <div class="grey--text">Organisation</div>
              <div>{{ user.metadata.org }}</div>
            </div>

            <div class="mb-3">
              <div class="grey--text">Unité</div>
              <div>{{ user.metadata.unit }}</div>
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

          <v-alert dismissible error v-model="passwordError">{{ passwordErrorText }}</v-alert>
          <v-alert dismissible success v-model="resetSuccess">Un nouveau mot de passe vous a été envoyé par mail.</v-alert>
          <p>Pour changer votre mot de passe, accédez à votre <a href="/kibana/app/kibana#/account">compte Kibana</a>.</p>
          <p>Mot de passe oublié ? <a href="javascript:void(0)" v-on:click="resetPassword">Cliquez-ici</a> pour le réinitialiser.</p>
        </v-card-text>
      </v-card>

      <v-card class="mb-4">
        <v-toolbar card>
          <v-toolbar-title>Token</v-toolbar-title>
        </v-toolbar>

        <v-card-text>
          <p>Ce token est nécessaire pour utiliser l'API d'ezMESURE. Pour l'utiliser, ajoutez le header suivant à vos requêtes : <code>Authorization: Bearer {insérez le token ici}</code></p>
          <v-text-field label="Token" textarea v-model="token" readonly></v-text-field>
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
  export default {
    async fetch ({ store }) {
      await store.dispatch('auth/checkAuth')
    },
    data () {
      return {
        resetSuccess: false,
        passwordError: null,
        passwordErrorText: '',
        redirectUrl: `/login?origin=${encodeURIComponent(window.location.href)}`,
        refreshUrl: `/login?refresh=1&origin=${encodeURIComponent(window.location.href)}`
      }
    },
    computed: {
      user () { return this.$store.state.auth.user },
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
