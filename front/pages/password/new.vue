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
        <PasswordForm :recovery="true" @save="savePassword" />
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import PasswordForm from '~/components/PasswordForm';

export default {
  middleware({ route, error }) {
    if (!route.query.token) {
      return error({ statusCode: 404 });
    }
    return false;
  },
  components: {
    PasswordForm,
  },
  methods: {
    async savePassword() {
      this.$router.push('/authenticate');
    },
  },
};
</script>
