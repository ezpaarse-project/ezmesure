<template>
  <v-toolbar density="comfortable" class="bg-transparent">
    <template #prepend>
      <v-btn
        icon="mdi-menu"
        @click="toggle()"
      />
    </template>

    <template #title>
      <slot name="title">
        {{ title }}
      </slot>
    </template>

    <template #append>
      <slot />

      <v-text-field
        v-if="showSearch"
        :model-value="search"
        :placeholder="$t('search')"
        append-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        width="200"
        hide-details
        class="mr-2"
        @update:model-value="$emit('update:search', $event)"
      />
    </template>
  </v-toolbar>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: undefined,
  },
  showSearch: {
    type: Boolean,
    default: false,
  },
  search: {
    type: String,
    default: undefined,
  },
});

defineEmits({
  'update:search': (value) => value != null,
});

const { toggle } = useDrawerStore();
</script>
