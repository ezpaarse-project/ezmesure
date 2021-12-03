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
            <v-toolbar-title v-text="$t('authenticate.restrictedAccess')" />
            <v-spacer />
            <v-icon>mdi-lock</v-icon>
          </v-toolbar>

          <v-expansion-panels accordion :value="provider">
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

                <v-form v-model="loginFormValid" class="mb-4" @submit.prevent="signin">
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

                  <v-row>
                    <a href="/password/reset" class="text-left ml-5 mt-2">
                      {{ $t('password.forgot') }}
                    </a>

                    <v-spacer />

                    <v-btn
                      class="mr-5"
                      color="primary"
                      type="submit"
                      :loading="connecting"
                      :disabled="!loginFormValid"
                      v-text="$t('authenticate.logIn')"
                    />
                  </v-row>
                </v-form>
              </v-expansion-panel-content>
            </v-expansion-panel>

            <v-expansion-panel v-if="$config.shibbolethEnabled">
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
                <p v-text="$t('authenticate.logInWithProvider')" />

                <p class="text-center">
                  <v-btn
                    color="primary"
                    :href="`/login?origin=${$auth.$state.redirect || '/myspace'}`"
                    v-text="$t('authenticate.logIn')"
                  />
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
  asyncData({ query, $config }) {
    let provider = $config.shibbolethEnabled ? 1 : 0;
    if (query?.provider === 'kibana') {
      provider = 0;
    }

    return {
      username: '',
      password: '',
      showError: false,
      errorMessage: '',
      loginFormValid: true,
      connecting: false,
      showPassword: false,
      provider,
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
