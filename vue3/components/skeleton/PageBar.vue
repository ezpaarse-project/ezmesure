<template>
  <v-toolbar :title="title" density="comfortable" class="bg-transparent">
    <template #prepend>
      <v-btn
        icon="mdi-menu"
        @click="toggle()"
      />
    </template>

    <v-spacer />

    <slot />

    <template v-if="$slots.extension" #extension="scope">
      <slot name="extension" v-bind="scope" />
    </template>
  </v-toolbar>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
});

const { toggle } = useDrawerStore();
</script>
