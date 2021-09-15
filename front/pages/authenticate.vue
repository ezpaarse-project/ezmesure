<template>
  <v-container fluid fill-height>
    <v-layout
      id="authenticate"
      row
      wrap
      align-center
      align-content-start
      justify-center
      class="text-center"
    >
      <v-flex xs12>
        <v-icon size="100">
          mdi-lock
        </v-icon>

        <h1
          class="display-1 mb-2"
          v-text="$t('authenticate.restrictedAccess')"
        />
      </v-flex>

      <v-flex xs12 sm12 md6 xl4 lg4 class="ma-2" align-self-start>
        <v-card>
          <v-card-text>
            <img
              src="/images/kibana-logo-color-horizontal.svg"
              alt="Kibana"
              height="48"
            >

            <p v-text="$t('authenticate.kibanaAuth')" />

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
                :label="$t('authenticate.user')"
                :rules="[() => !!username || ($t('authenticate.fieldIsRequired'))]"
                prepend-inner-icon="mdi-account"
                outlined
                required
              />

              <v-text-field
                v-model="password"
                :label="$t('authenticate.password')"
                :type="showPassword ? 'text' : 'password'"
                :rules="[() => !!password || ($t('authenticate.fieldIsRequired'))]"
                prepend-inner-icon="mdi-lock"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                outlined
                required
                @click:append="showPassword = !showPassword"
              />

              <v-layout justify-space-between>
                <a href="/password/reset" class="text-left ml-5 mt-2">
                  {{ $t('password.forgot') }}
                </a>

                <v-btn
                  class="mr-5"
                  color="primary"
                  type="submit"
                  :loading="connecting"
                  :disabled="!loginFormValid"
                  v-text="$t('authenticate.logIn')"
                />
              </v-layout>
            </v-form>
          </v-card-text>
        </v-card>
      </v-flex>

      <v-flex v-if="shibbolethEnabled" xs12 sm12 md6 xl4 lg4 class="ma-2" align-self-start>
        <v-card>
          <v-card-text>
            <img
              src="/images/shibboleth_logowordmark_color.png"
              alt="Shibboleth"
              height="64"
            >

            <p v-text="$t('authenticate.logInWithProvider')" />

            <p class="text-center">
              <v-btn
                color="primary"
                :href="`/login?origin=${$auth.$state.redirect || '/myspace'}`"
                v-text="$t('authenticate.logIn')"
              />
            </p>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  layout: 'home',
  middleware: ['auth'],
  asyncData({ env }) {
    return {
      username: '',
      password: '',
      showError: false,
      errorMessage: '',
      loginFormValid: true,
      connecting: false,
      showPassword: false,
      shibbolethEnabled: env.shibbolethEnabled,
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
          this.errorMessage = this.$t('authenticate.loginFailed');
          this.showError = true;
        } else {
          this.errorMessage = this.$t('authenticate.failed');
          this.showError = true;
        }
      }

      this.connecting = false;
    },
  },
};
</script>
