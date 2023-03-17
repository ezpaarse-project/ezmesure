<template>
  <v-app>
    <AppBar />

    <v-main>
      <nuxt />
    </v-main>

    <AppSnackbar />
  </v-app>
</template>

<script>
import AppBar from '~/components/AppBar.vue';
import AppSnackbar from '~/components/AppSnackbar.vue';

export default {
  components: {
    AppBar,
    AppSnackbar,
  },
};
</script>
