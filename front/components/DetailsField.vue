<template>
  <v-col :cols="cols">
    <div class="font-weight-medium">
      <v-icon v-if="prependIcon" :icon="prependIcon" />

      {{ label }}
    </div>

    <div class="text-muted">
      <slot :value="value">
        {{ value }}
      </slot>
    </div>
  </v-col>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    default: '',
  },
  prependIcon: {
    type: String,
    default: undefined,
  },
  cols: {
    type: [String, Number],
    default: undefined,
  },
});
</script>
