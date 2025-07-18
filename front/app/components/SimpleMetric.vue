<template>
  <v-sheet
    class="d-flex flex-column justify-start align-center"
    style="gap: 10px"
  >
    <v-icon :icon="icon" :color="color" size="x-large" />

    <div class="text-center">
      {{ text }}
    </div>

    <div>
      <slot name="actions" />
    </div>
  </v-sheet>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '',
  },
});
</script>
