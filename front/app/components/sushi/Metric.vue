<template>
  <SimpleMetric
    :title="title"
    :value="`${value}`"
    :icon="icon"
    :color="color"
  >
    <template v-if="actionText" #actions>
      <v-btn
        :text="actionText"
        :disabled="value <= 0"
        :loading="loading"
        size="small"
        variant="outlined"
        @click="$emit('click')"
      />
    </template>
  </SimpleMetric>
</template>

<script setup>
defineProps({
  value: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: undefined,
  },
  color: {
    type: String,
    default: undefined,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  actionText: {
    type: String,
    default: undefined,
  },
});

defineEmits({
  click: () => true,
});
</script>
