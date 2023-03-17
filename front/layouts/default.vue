<template>
  <v-app>
    <AppBar />

    <v-main>
      <nuxt />
    </v-main>

    <Snackbar />
  </v-app>
</template>

<script>
import AppBar from '~/components/AppBar.vue';
import Snackbar from '~/components/Snackbar.vue';

export default {
  components: {
    AppBar,
    Snackbar,
  },
};
</script>
