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
            <v-toolbar-title v-text="$t('password.forgot')" />
            <v-spacer />
            <v-icon>mdi-lock</v-icon>
          </v-toolbar>

          <v-card-text>
            <PasswordForm :recovery="true" @save="savePassword" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
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
      this.$router.push('/authenticate?provider=kibana');
    },
  },
};
</script>
