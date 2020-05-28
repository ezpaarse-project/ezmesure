<template>
  <v-container
    fluid
    fill-height
  >
    <v-row
      align="center"
      justify="center"
    >
      <v-col style="max-width: 600px">
        <v-card class="elevation-12">
          <v-toolbar
            color="primary"
            dark
            flat
            dense
          >
            <v-toolbar-title>Accès restreint</v-toolbar-title>
            <v-spacer />
            <v-icon>mdi-lock</v-icon>
          </v-toolbar>

          <v-expansion-panels accordion :value="1">
            <v-expansion-panel>
              <v-expansion-panel-header>
                <div>
                  <img
                    src="/images/kibana-logo-color-horizontal.svg"
                    alt="Kibana"
                    height="35"
                  >
                </div>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <p>
                  Vous êtes déjà enregistré ?
                  Connectez-vous avec vos identifiants Kibana.
                </p>

                <v-alert
                  v-model="showError"
                  dismissible
                  prominent
                  dense
                  type="error"
                >
                  {{ errorMessage }}
                </v-alert>

                <v-form v-model="loginFormValid" @submit.prevent="signin">
                  <v-text-field
                    v-model="username"
                    label="Utilisateur"
                    :rules="[() => !!username || ('Ce champ est requis')]"
                    prepend-inner-icon="mdi-account"
                    outlined
                    required
                  />
                  <v-text-field
                    v-model="password"
                    label="Mot de passe"
                    :type="showPassword ? 'text' : 'password'"
                    :rules="[() => !!password || ('Ce champ est requis')]"
                    prepend-inner-icon="mdi-lock"
                    :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    outlined
                    required
                    @click:append="showPassword = !showPassword"
                  />

                  <p class="text-center">
                    <v-btn
                      color="primary"
                      type="submit"
                      :loading="connecting"
                      :disabled="!loginFormValid"
                    >
                      Se connecter
                    </v-btn>
                  </p>
                </v-form>
              </v-expansion-panel-content>
            </v-expansion-panel>

            <v-expansion-panel>
              <v-expansion-panel-header>
                <div>
                  <img
                    src="/images/shibboleth_logowordmark_color.png"
                    alt="Shibboleth"
                    height="40"
                  >
                </div>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <p>
                  Connectez-vous via votre fournisseur d'identité.
                </p>

                <p class="text-center">
                  <v-btn
                    color="primary"
                    :href="`/login?origin=${$auth.$state.redirect || '/myspace'}`"
                  >
                    Se connecter
                  </v-btn>
                </p>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  middleware: ['auth'],
  data() {
    return {
      username: '',
      password: '',
      showError: false,
      errorMessage: '',
      loginFormValid: true,
      connecting: false,
      showPassword: false,
    };
  },
  methods: {
    async signin() {
      this.connecting = true;
      this.showError = false;
      this.errorMessage = '';

      try {
        await this.$auth.loginWith('local', {
          data: {
            username: this.username,
            password: this.password,
          },
        });
      } catch (err) {
        const statusCode = (err.response && err.response.status) || 500;

        if (statusCode >= 400 && statusCode < 500) {
          this.errorMessage = 'Les informations transmises n\'ont pas permis de vous authentifier';
          this.showError = true;
        } else {
          this.errorMessage = 'Une erreur est survenue';
          this.showError = true;
        }
      }

      this.connecting = false;
    },
  },
};
</script>
