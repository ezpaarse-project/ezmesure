<template>
  <v-app>
    <AppBar />

    <v-content>
      <nuxt />
    </v-content>

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
