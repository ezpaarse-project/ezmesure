<template>
  <section>
    <v-text-field
      v-model="password"
      class="mb-2"
      :label="$t('password.password')"
      :type="showPassword ? 'text' : 'password'"
      :rules="passwordRules"
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
      :rules="repeatPasswordRules"
      prepend-inner-icon="mdi-lock"
      outlined
      required
      @click:append="showPassword = !showPassword"
    />
  </section>
</template>

<script>
export default {
  data() {
    return {
      password: '',
      passwordRepeat: '',
      sendingPassword: false,
      showPassword: false,
      validForm: false,
    };
  },
  computed: {
    passwordRules() {
      return [
        !!this.password || this.$t('password.passwordIsRequired'),
        !(this.password.length < 6) || this.$t('password.length'),
      ];
    },
    repeatPasswordRules() {
      return [
        !!this.passwordRepeat || this.$t('password.passwordIsRequired'),
        this.passwordRepeat === this.password || (this.$t('password.notEqual')),
        !(this.passwordRepeat.length < 6) || (this.$t('password.length')),
      ];
    },
    shouldEmitPassword() {
      return this.passwordRules.every((v) => v === true)
       && this.repeatPasswordRules.every((v) => v === true);
    },
  },
  watch: {
    shouldEmitPassword() {
      if (this.shouldEmitPassword) {
        this.$emit('input', this.password);
      } else {
        this.$emit('input', '');
      }
    },
  },
};
</script>
