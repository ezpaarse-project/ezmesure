<template>
  <v-toolbar flat color="grey lighten-3">
    <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
    <v-toolbar-title v-text="title" />

    <slot />
  </v-toolbar>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: () => '',
    },
  },
  computed: {
    drawer: {
      get() { return this.$store.state.drawer; },
      set(newVal) { this.$store.dispatch('SET_DRAWER', newVal); },
    },
  },
};
</script>
