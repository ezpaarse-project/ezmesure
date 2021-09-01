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
            <v-toolbar-title v-text="$t('password.forgotPassword')" />
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
            <v-alert type="success" :value="reseted" v-html="$t('password.checkYourEmail')"/>
            <v-btn
              v-if="reseted"
              block
              color="primary"
              to="/authenticate"
              v-text="$t('password.backToLogin')"
            />

            <v-form
              v-if="!reseted"
              v-model="resetFormValid"
              @submit.prevent="resetPassword"
            >
              <p v-text="$t('password.enterUser')" />

              <v-text-field
                v-model="username"
                :label="$t('password.user')"
                :rules="[() => !!username || ($t('password.fieldIsRequired'))]"
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
                :disabled="!resetFormValid"
              >
                {{ $t('password.resetPassword') }}
              </v-btn>


              <a href="/authenticate" class="caption">
                {{ $t('password.backToLogin') }}
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
      resetFormValid: true,
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
        await this.$axios.$post('/profile/password/_get_token', { username: this.username });
        this.reseted = true;
      } catch (e) {
        this.resetError = true;
        if (e.response.status >= 400 && e.response.status < 500) {
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
