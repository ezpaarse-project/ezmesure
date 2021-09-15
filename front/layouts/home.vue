<template>
  <v-app>
    <AppBar />
    <Drawer />

    <v-main>
      <nuxt />
    </v-main>

    <Footer />

    <v-btn
      v-show="fab"
      v-scroll="onScroll"
      fab
      dark
      fixed
      bottom
      right
      style="margin: 0 0 60px 0"
      @click="toTop"
    >
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>

    <Snackbar />
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
  data: () => ({
    fab: false,
  }),
  methods: {
    onScroll(e) {
      if (typeof window === 'undefined') return;
      const top = window.pageYOffset || e.target.scrollTop || 0;
      this.fab = top > 20;
    },
    toTop() {
      this.$vuetify.goTo(0);
    },
  },
};
</script>
