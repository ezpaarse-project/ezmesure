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
import AppBar from '~/components/AppBar';
import Snackbar from '~/components/Snackbar';

export default {
  components: {
    AppBar,
    Snackbar,
  },
};
</script>
