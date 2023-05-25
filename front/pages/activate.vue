<template>
  <v-container fluid fill-height>
    <v-layout align-center justify-center>
      <v-flex xs12 sm8 md4>
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat dense>
            <v-toolbar-title>{{ $t("account.title") }}</v-toolbar-title>
            <v-spacer />
            <v-icon>mdi-text</v-icon>
          </v-toolbar>

          <v-card-text>
            <v-alert v-model="error" dismissible prominent dense type="error">
              {{ $t("errors.generic") }}
            </v-alert>
            <v-alert
              v-model="pleaseAccept"
              dismissible
              prominent
              dense
              type="error"
            >
              {{ $t("account.acceptTerms") }}
            </v-alert>

            <v-form v-model="validForm" @submit.prevent="submit">
              <PasswordForm @input="setPassword" />
              <!-- eslint-disable-next-line -->
              <p v-html="$t('validation.description')" />

              <v-checkbox
                v-model="accepted"
                :rules="[() => !!accepted || $t('validation.acceptTerms')]"
                :label="$t('validation.readAndAccept')"
              />

              <v-btn
                block
                color="primary"
                type="submit"
                class="my-2"
                :disabled="!accepted"
                :loading="loading"
              >
                {{ $t("account.activate") }}
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import PasswordForm from '~/components/PasswordForm.vue';

export default {
  middleware({ $auth, route, error }) {
    if (!$auth?.loggedIn && !route?.query?.token) {
      return error({ statusCode: 404 });
    }
    return true;
  },
  components: {
    PasswordForm,
  },
  data() {
    return {
      pleaseAccept: false,
      accepted: false,
      error: false,
      loading: false,
      activated: false,
      password: false,
    };
  },
  computed: {
    validForm() {
      return [
        !!this.password && !(this.password.length < 6) && this.accepted,
      ];
    },
  },
  methods: {
    setPassword(value) {
      this.password = value;
    },
    async submit() {
      this.loading = true;

      this.error = false;
      this.pleaseAccept = false;

      if (!this.accepted) {
        this.pleaseAccept = true;
        return;
      }

      try {
        let headers;
        if (this.$route.query.token) {
          headers = { Authorization: `Bearer ${this.$route.query.token}` };
        }
        await this.$axios.$post(
          '/profile/_activate',
          {
            password: this.password,
            acceptTerms: this.accepted,
            username: this.$route.query.username,
          },
          { headers },
        );

        await this.$auth.fetchUser();

        this.$router.replace({ path: '/myspace' });
      } catch (e) {
        this.error = true;
      }

      this.loading = false;
    },
  },
};
</script>
