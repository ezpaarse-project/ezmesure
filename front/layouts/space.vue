<template>
  <v-app>
    <Menu />

    <AppBar />

    <v-content>
      <v-card flat tile color="transparent">
        <nuxt />
      </v-card>
    </v-content>

    <Snackbar />
  </v-app>
</template>

<script>
import AppBar from '~/components/AppBar';
import Snackbar from '~/components/Snackbar';
import Menu from '~/components/space/Menu';

export default {
  components: {
    AppBar,
    Snackbar,
    Menu,
  },
};
</script>
