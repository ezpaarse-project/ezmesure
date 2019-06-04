<template>
  <v-app light>
    <AppBar />

    <v-content>
      <nuxt />
    </v-content>
  </v-app>
</template>

<script>
import AppBar from '~/components/AppBar';

export default {
  components: {
    AppBar,
  },
};
</script>
