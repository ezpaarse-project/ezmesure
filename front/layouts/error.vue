<template>
  <v-app>
    <AppBar />

    <main>
      <v-container fluid class="text-center">
        <v-icon size="128">
          mdi-emoticon-sad-outline
        </v-icon>
        <h1
          v-if="error"
          class="display-1"
        >
          {{ error.statusCode }}
        </h1>
        <h2 v-if="error">
          {{ errorMessage }}
        </h2>
        <h1
          v-else
          class="display-1"
        >
          {{ $t('errors.generic') }}
        </h1>
      </v-container>
    </main>
  </v-app>
</template>

<script>
import AppBar from '~/components/AppBar.vue';

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
  computed: {
    errorMessage() {
      if (this.$te(`errors.${this.error.statusCode}`)) {
        return this.$t(`errors.${this.error.statusCode}`);
      }
      return this.error.message;
    },
  },
  head() {
    return this.$nuxtI18nHead({
      addDirAttribute: true,
      addSeoAttributes: true,
    });
  },
};
</script>
