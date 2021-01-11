<template>
  <v-toolbar flat :dark="dark">
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
    dark: {
      type: Boolean,
      default: () => false,
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
