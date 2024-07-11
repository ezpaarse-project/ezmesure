<template>
  <v-menu v-model="open" location="top">
    <template #activator="{ props: menu }">
      <v-slide-y-reverse-transition>
        <v-btn
          v-show="selected.length > 0"
          :text="text"
          :prepend-icon="open ? 'mdi-chevron-down' : 'mdi-chevron-up'"
          color="primary"
          position="fixed"
          location="bottom right"
          size="large"
          style="bottom: 1rem; right: 1rem;"
          v-bind="menu"
        />
      </v-slide-y-reverse-transition>
    </template>

    <v-list>
      <slot name="actions" />
    </v-list>
  </v-menu>
</template>

<script setup>
defineProps({
  selected: {
    type: Array,
    default: () => [],
  },
  text: {
    type: String,
    default: '',
  },
});

const open = ref(false);
</script>
