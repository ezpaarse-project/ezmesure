<template>
  <v-toolbar flat :dark="dark">
    <slot name="nav-icon">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
    </slot>

    <v-toolbar-title>
      {{ title }}
    </v-toolbar-title>

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
