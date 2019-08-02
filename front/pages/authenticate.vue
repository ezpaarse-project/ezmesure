<template>
  <v-container
    fluid
    fill-height
  >
    <v-layout
      align-center
      justify-center
    >
      <v-flex
        xs12
        sm8
        md4
      >
        <v-card class="elevation-12">
          <v-toolbar
            color="primary"
            dark
            flat
            dense
          >
            <v-toolbar-title>Accès restreint</v-toolbar-title>
            <v-spacer />
            <v-icon>mdi-lock</v-icon>
          </v-toolbar>
          <v-card-text>
            Pour accéder à cette page, veuillez vous authentifier.
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="primary" :href="redirectUrl">
              Se connecter
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  async fetch({ store, redirect }) {
    await store.dispatch('auth/checkAuth');
    const { user } = store.state.auth;

    if (user) {
      redirect('/');
    }
  },
  asyncData({ query }) {
    return {
      redirectUrl: `/login?origin=${query.origin || '/myspace'}`,
    };
  },
};
</script>
