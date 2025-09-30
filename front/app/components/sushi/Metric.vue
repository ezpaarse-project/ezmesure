<template>
  <SimpleMetric
    :title="title"
    :icon="icon"
    :color="color"
  >
    <template #value>
      {{ modelValue.total }}

      <span v-if="shouldShowEnabled" style="font-size: 0.65em">
        {{ $t('sushi.nEnabled', modelValue.enabled) }}
      </span>
    </template>

    <template v-if="actionText" #actions>
      <v-btn
        :text="actionText"
        :disabled="modelValue.total <= 0"
        :loading="loading"
        size="small"
        variant="outlined"
        @click="$emit('click')"
      />
    </template>
  </SimpleMetric>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
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

const shouldShowEnabled = computed(
  () => props.modelValue.total > 0
      && props.modelValue.enabled != null
      && props.modelValue.total !== props.modelValue.enabled,
);
</script>
