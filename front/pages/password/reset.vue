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
          v-text="$t('password.forgot')"
        />
      </v-flex>

      <v-flex xs12 sm12 md6 xl4 lg4 class="ma-2">
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
        <v-alert type="success" :value="reset" v-html="$t('password.checkYourEmail')"/>

        <v-btn
          v-if="reset"
          block
          color="primary"
          to="/authenticate"
          v-text="$t('password.backToLogin')"
        />

        <v-form
          v-if="!reset"
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
            {{ $t('password.reset') }}
          </v-btn>


          <a href="/authenticate" class="caption">
            {{ $t('password.backToLogin') }}
          </a>
        </v-form>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  layout: 'home',
  data() {
    return {
      username: null,
      resetFormValid: true,
      resettingPassword: false,
      resetError: null,
      resetErrorText: '',
      reset: false,
    };
  },
  methods: {
    async resetPassword() {
      this.connecting = true;
      this.resettingPassword = true;
      this.resetError = null;

      try {
        await this.$axios.$post('/profile/password/_get_token', { username: this.username });
        this.reset = true;
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
