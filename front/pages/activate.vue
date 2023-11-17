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
            <v-alert
              class="mt-1"
              :value="error"
              dismissible
              prominent
              dense
              type="error"
            >
              {{ sendErrorText }}
            </v-alert>
            <v-form v-model="validForm" @submit.prevent="submit">
              <PasswordForm @input="setPassword" />
              <i18n path="account.description.text" tag="p">
                <template #regulationLink>
                  <a href="https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX%3A32016R0679#PP2" target="_blank">{{ $t('account.description.regulationLink') }}</a>
                </template>
              </i18n>

              <v-checkbox
                v-model="accepted"
                :rules="[() => !!accepted || $t('account.acceptTerms')]"
                :label="$t('account.readAndAccept')"
              />

              <v-btn
                block
                color="primary"
                type="submit"
                class="my-2"
                :disabled="!validForm"
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
      sendErrorText: '',
      loading: false,
      activated: false,
      password: false,
      validForm: false,
    };
  },
  methods: {
    setPassword(value) {
      this.password = value;
    },
    async submit() {
      this.error = false;
      this.pleaseAccept = false;

      if (!this.accepted) {
        this.pleaseAccept = true;
        this.sendErrorText = this.$t('account.acceptTerms');
        return;
      }

      this.loading = true;

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
        if (e.response.status >= 400 && e.response.status < 500) {
          this.sendErrorText = e.response.data.error;
        } else if (e.response.statusText) {
          this.sendErrorText = e.response.statusText;
        } else {
          this.sendErrorText = e.message;
        }
      }

      this.loading = false;
    },
  },
};
</script>
