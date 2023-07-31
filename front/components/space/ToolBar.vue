<template>
  <v-toolbar flat v-bind="$attrs">
    <slot name="nav-icon">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
    </slot>

    <v-toolbar-title v-if="title">
      {{ title }}
    </v-toolbar-title>
    <slot />

    <template #extension="scope">
      <slot name="extension" v-bind="scope" />
    </template>

    <template #img="scope">
      <slot name="img" v-bind="scope" />
    </template>
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
