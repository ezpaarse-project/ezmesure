<template>
  <section>
    <ToolBar title="Identifiants kibana">
      <slot>
        <v-spacer />

        <v-btn text @click="showPasswordReset = true">
          <v-icon left>
            mdi-lock-question
          </v-icon>
          Mot de passe oublié
        </v-btn>
      </slot>
    </ToolBar>
    <v-card-text>
      <p>
        Ce nom d'utilisateur vous permet de vous connecter à l'interface
        Kibana afin d'accéder à vos tableaux de bord.
        Pour changer votre mot de passe,
        accédez à votre <a href="/kibana/app/kibana#/account">compte Kibana</a>.
      </p>

      <v-text-field
        :value="user.username"
        append-icon="mdi-account"
        label="Nom d'utilisateur"
        readonly
        outlined
      />
    </v-card-text>

    <v-dialog v-model="showPasswordReset" width="500">
      <v-card>
        <v-toolbar
          color="primary"
          dark
          flat
          dense
        >
          <v-toolbar-title>Mot de passe oublié</v-toolbar-title>
          <v-spacer />
          <v-icon>mdi-lock-question</v-icon>
        </v-toolbar>

        <v-card-text>
          <v-alert
            :value="resetError"
            dismissible
            prominent
            dense
            type="error"
          >
            {{ resetErrorText }}
          </v-alert>
          <v-alert
            :value="resetSuccess"
            dismissible
            prominent
            dense
            type="success"
          >
            Un nouveau mot de passe vous a été envoyé par mail.
          </v-alert>

          Vous ne vous souvenez plus de votre mot de passe ?
          Cliquez sur <code>réinitialiser</code> pour en recevoir un nouveau par mail.
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showPasswordReset = false">
            Fermer
          </v-btn>
          <v-btn
            color="primary"
            text
            :loading="resettingPassword"
            @click="resetPassword"
          >
            Réinitialiser
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar';

export default {
  layout: 'space',
  middleware: 'isLoggin',
  components: {
    ToolBar,
  },
  data() {
    return {
      showPasswordReset: false,
      resettingPassword: false,
      resetSuccess: false,
      resetError: null,
      resetErrorText: '',
      selectedFiles: [],
    };
  },
  computed: {
    user() { return this.$store.state.auth.user; },
    nbSelectedFiles() { return this.selectedFiles.length; },
  },
  methods: {
    async resetPassword() {
      this.resetError = null;
      this.resetSuccess = false;
      this.resettingPassword = true;

      try {
        await this.$store.dispatch('auth/resetPassword');
        this.resetSuccess = true;
      } catch (e) {
        this.resetError = true;
        if (e.response.status >= 400 && e.response.status < 500) {
          this.resetErrorText = e.response.body;
        } else if (e.response.statusText) {
          this.resetErrorText = e.response.statusText;
        } else {
          this.resetErrorText = e.message;
        }
      }

      this.resettingPassword = false;
    },
  },
};
</script>
