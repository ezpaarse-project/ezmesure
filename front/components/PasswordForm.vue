<template>
  <section>
    <v-alert
      class="mt-1"
      :value="sendError"
      dismissible
      prominent
      dense
      type="error"
    >
      {{ sendErrorText }}
    </v-alert>
    <v-form
      v-model="validForm"
      @submit.prevent="save"
    >
      <v-text-field
        v-model="password"
        class="mb-2"
        :label="$t('password.password')"
        :type="showPassword ? 'text' : 'password'"
        :rules="[
          () => !!password || ($t('password.fieldIsRequired')),
          () => !(password.length < 6) || ($t('password.length'))
        ]"
        prepend-inner-icon="mdi-lock"
        :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
        outlined
        required
        :hint="$t('password.pattern')"
        persistent-hint
        @click:append="showPassword = !showPassword"
      />

      <v-text-field
        v-model="passwordRepeat"
        :label="$t('password.repeatPassword')"
        :type="showPassword ? 'text' : 'password'"
        :rules="[
          () => !!passwordRepeat || ($t('password.fieldIsRequired')),
          () => passwordRepeat === password || ($t('password.notEqual')),
          () => !(passwordRepeat.length < 6) || ($t('password.length'))
        ]"
        prepend-inner-icon="mdi-lock"
        outlined
        required
        @click:append="showPassword = !showPassword"
      />

      <slot>
        <v-btn
          block
          color="primary"
          type="submit"
          class="mb-2"
          :loading="passwordSaved"
          :disabled="!validForm"
        >
          {{ $t('password.save') }}
        </v-btn>
      </slot>
    </v-form>
  </section>
</template>

<script>
export default {
  props: {
    passwordSaved: {
      type: Boolean,
      default: () => false,
    },
    recovery: {
      type: Boolean,
      default: () => false,
    },
  },
  data() {
    return {
      password: '',
      passwordRepeat: '',
      sendingPassword: false,
      showPassword: false,
      sendError: null,
      sendErrorText: '',
      validForm: false,
      saved: this.passwordSaved,
    };
  },
  methods: {
    async query() {
      if (this.recovery) {
        return this.$axios.$post('/profile/password/_reset', {
          token: this.$route.query.token,
          password: this.password,
          passwordRepeat: this.passwordRepeat,
        });
      }

      return this.$axios.$put('/profile/password', {
        password: this.password,
        passwordRepeat: this.passwordRepeat,
      });
    },
    async save() {
      this.saved = true;

      try {
        await this.query();

        this.$store.dispatch('snacks/success', this.$t('password.updated'));
        this.$emit('save');
      } catch (e) {
        this.sendError = true;
        if (e.response.status >= 400 && e.response.status < 500) {
          this.sendErrorText = e.response.data.error;
        } else if (e.response.statusText) {
          this.sendErrorText = e.response.statusText;
        } else {
          this.sendErrorText = e.message;
        }
      }

      this.saved = false;
    },
  },
};
</script>
