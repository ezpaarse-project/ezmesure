<template>
  <v-app>
    <SpaceMenu />

    <AppBar />

    <v-main>
      <v-card flat tile color="transparent">
        <nuxt />
      </v-card>
    </v-main>

    <Snackbar />
  </v-app>
</template>

<script>
import AppBar from '~/components/AppBar.vue';
import Snackbar from '~/components/Snackbar.vue';
import SpaceMenu from '~/components/space/SpaceMenu.vue';

export default {
  components: {
    AppBar,
    Snackbar,
    SpaceMenu,
  },
};
</script>
