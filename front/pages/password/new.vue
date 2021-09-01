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
              :value="sendError"
              dismissible
              prominent
              dense
              type="error"
            >
              {{ sendErrorText }}
            </v-alert>

            <v-form
              v-model="passwordFormValid"
              @submit.prevent="sendPassword"
            >
              <v-text-field
                v-model="password"
                :label="$t('password.password')"
                :type="showPassword ? 'text' : 'password'"
                :rules="[() => !!password || ($t('password.fieldIsRequired'))]"
                prepend-inner-icon="mdi-lock"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                outlined
                required
                @click:append="showPassword = !showPassword"
              />

              <v-text-field
                v-model="passwordRepeat"
                :label="$t('password.repeatPassword')"
                :type="showPassword ? 'text' : 'password'"
                :rules="[
                  () => !!passwordRepeat || ($t('password.fieldIsRequired')),
                  () => passwordRepeat === password || ($t('password.notEqual'))
                ]"
                prepend-inner-icon="mdi-lock"
                outlined
                required
                @click:append="showPassword = !showPassword"
              />

              <v-btn
                block
                color="primary"
                type="submit"
                class="mb-2"
                :loading="sendingPassword"
                :disabled="!passwordFormValid"
              >
                {{ $t('password.resetPassword') }}
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  middleware({ route, error }) {
    if (!route.query.token) {
      return error({ statusCode: 404 });
    }
    return false;
  },
  data() {
    return {
      password: '',
      passwordRepeat: '',
      passwordFormValid: true,
      sendingPassword: false,
      sendError: null,
      sendErrorText: '',
      showPassword: false,
    };
  },
  methods: {
    async sendPassword() {
      this.sendingPassword = true;

      try {
        await this.$axios.$post('/profile/password/_reset', {
          token: this.$route.query.token,
          password: this.password,
          passwordRepeat: this.passwordRepeat,
        });

        this.$store.dispatch('snacks/success', this.$t('password.updated'));
        this.$router.push('/authenticate?provider=kibana');
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

      this.sendingPassword = false;
    },
  },
};
</script>
