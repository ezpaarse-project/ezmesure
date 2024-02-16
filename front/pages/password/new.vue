<template>
  <v-container fluid fill-height>
    <v-row align="center" justify="center">
      <v-col style="max-width: 600px">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat dense>
            <v-toolbar-title>
              {{ $t("password.forgot") }}
            </v-toolbar-title>

            <v-spacer />

            <v-icon>mdi-lock</v-icon>
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

              <v-btn
                block
                color="primary"
                type="submit"
                class="my-2"
                :disabled="!validForm"
                :loading="loading"
              >
                {{ $t("password.update") }}
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import PasswordForm from '~/components/PasswordForm.vue';

export default {
  middleware({ route, error }) {
    if (!route?.query?.token) {
      return error({ statusCode: 404 });
    }
    return true;
  },
  components: {
    PasswordForm,
  },
  data() {
    return {
      loading: false,
      password: false,
      accepted: false,
      validForm: false,
      error: null,
      sendErrorText: '',
    };
  },
  methods: {
    setPassword(value) {
      this.password = value;
    },
    async submit() {
      try {
        const headers = { Authorization: `Bearer ${this.$route.query.token}` };
        this.loading = true;
        await this.$axios.$post('/profile/password/_reset', {
          password: this.password,
        }, { headers });
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
    async savePassword() {
      this.$router.push('/authenticate?provider=kibana');
    },
  },
};
</script>
