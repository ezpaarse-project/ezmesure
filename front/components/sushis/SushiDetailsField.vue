<template>
  <v-col :cols="cols">
    <div class="font-weight-medium">
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
  cols: {
    type: [String, Number],
    default: undefined,
  },
});
</script>
