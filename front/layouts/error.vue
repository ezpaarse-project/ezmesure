<template>
  <v-app light>
    <AppBar />

    <main>
      <v-container fluid class="text-xs-center">
        <h1 v-if="error.statusCode === 404" class="display-1">
          Page introuvable
        </h1>
        <h1 v-else class="display-1">
          Une erreur est survenue
        </h1>
      </v-container>
    </main>
  </v-app>
</template>

<script>
import AppBar from '~/components/AppBar';

export default {
  props: {
    error: {
      type: Object,
      default: () => ({}),
    },
  },
  components: {
    AppBar,
  },
};
</script>
