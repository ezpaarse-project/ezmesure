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
            <v-toolbar-title v-text="$t('authenticate.forgotPassword')" />
            <v-spacer />
            <v-icon>mdi-lock</v-icon>
          </v-toolbar>

          <v-card-text>
            <v-alert
              class="mt-1"
              :value="resetError"
              dismissible
              prominent
              dense
              type="error"
            >
              {{ resetErrorText }}
            </v-alert>

            <!-- eslint-disable-next-line -->
            <v-alert type="success" :value="reseted" v-html="$t('authenticate.checkYourEmail')"/>
            <v-btn
              v-if="reseted"
              block
              color="primary"
              to="/authenticate"
              v-text="$t('authenticate.backToLogin')"
            />

            <v-form
              v-if="!reseted"
              v-model="loginFormValid"
              @submit.prevent="resetPassword"
            >
              <p v-text="$t('authenticate.enterUser')" />

              <v-text-field
                v-model="username"
                :label="$t('authenticate.user')"
                :rules="[() => !!username || ($t('authenticate.fieldIsRequired'))]"
                prepend-inner-icon="mdi-account"
                outlined
                required
              />

              <v-btn
                block
                color="primary"
                type="submit"
                class="mb-2"
                :loading="resettingPassword"
                :disabled="!loginFormValid"
              >
                {{ $t('authenticate.resetPassword') }}
              </v-btn>


              <a href="/authenticate" class="caption">
                {{ $t('authenticate.backToLogin') }}
              </a>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      username: null,
      loginFormValid: true,
      resettingPassword: false,
      resetError: null,
      resetErrorText: '',
      reseted: false,
    };
  },
  methods: {
    async resetPassword() {
      this.connecting = true;
      this.resettingPassword = true;
      this.resetError = null;

      try {
        await this.$axios.$post('/profile/password/reset', { username: this.username });
        this.reseted = true;
      } catch (e) {
        this.resetError = true;
        if (e.response.data.status >= 400 && e.response.data.status < 500) {
          this.resetErrorText = e.response.data.error;
        } else if (e.response.statusText) {
          this.resetErrorText = e.response.statusText;
        } else {
          this.resetErrorText = e.message;
        }
      }

      this.resettingPassword = false;
      this.connecting = false;
    },
  },
};
</script>
