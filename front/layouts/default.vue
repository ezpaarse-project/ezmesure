<template>
  <v-app>
    <AppBar :inverted-scroll="isHomepage" />

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
  computed: {
    isHomepage() {
      return this.$route.name === 'index';
    },
  },
};
</script>
