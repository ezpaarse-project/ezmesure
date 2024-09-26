<template>
  <div class="container">
    <div v-if="prependIcon" class="icon mr-4">
      <v-icon :icon="prependIcon" />
    </div>
    <div>
      <v-label v-if="label" :text="label" class="label" />

      <v-btn-toggle
        :model-value="modelValue"
        color="primary"
        density="comfortable"
        rounded
        @update:model-value="$emit('update:modelValue', $event)"
      >
        <v-btn :value="true" size="small" variant="outlined">
          {{ trueText || $t('yes') }}
        </v-btn>

        <v-btn :value="false" size="small" variant="outlined">
          {{ falseText || $t('no') }}
        </v-btn>
      </v-btn-toggle>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: undefined,
  },
  trueText: {
    type: String,
    default: undefined,
  },
  falseText: {
    type: String,
    default: undefined,
  },
  label: {
    type: String,
    default: undefined,
  },
  prependIcon: {
    type: String,
    default: undefined,
  },
});

defineEmits({
  'update:modelValue': (val) => val === undefined || typeof val === 'boolean',
});
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  align-items: center;

  & .icon {
    color: gray;
  }

  & .label {
    position: absolute !important;
    max-width: 133%;
    transform-origin: top left;
    transform: translateY(-16px) scale(.75);

    & + * {
      transform: translateY(5px)
    }
  }
}
</style>
