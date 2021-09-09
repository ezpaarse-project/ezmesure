<template>
  <v-app>
    <AppBar />
    <Drawer />

    <v-content>
      <nuxt />
    </v-content>

    <Snackbar />
    <Footer />
  </v-app>
</template>

<script>
import AppBar from '~/components/Home/AppBar';
import Drawer from '~/components/Home/Drawer';
import Snackbar from '~/components/Snackbar';
import Footer from '~/components/Home/Footer';

export default {
  components: {
    AppBar,
    Drawer,
    Snackbar,
    Footer,
  },
};
</script>
