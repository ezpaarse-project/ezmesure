<template>
  <SimpleMetric
    :text="$t(titleKey, modelValue)"
    :icon="icon"
    :color="color"
  >
    <template v-if="actionText" #actions>
      <v-btn
        :text="actionText"
        :disabled="modelValue <= 0"
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
  modelValue: {
    type: Number,
    required: true,
  },
  titleKey: {
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
