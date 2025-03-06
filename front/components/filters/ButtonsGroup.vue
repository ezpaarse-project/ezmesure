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
        variant="outlined"
        rounded
        @update:model-value="$emit('update:modelValue', $event)"
      >
        <v-btn
          v-for="btn in buttons"
          :key="btn.value"
          v-bind="btn"
        />
      </v-btn-toggle>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: [Boolean, String, Number],
    default: undefined,
  },
  items: {
    type: Array,
    default: () => [true, false],
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

const { t } = useI18n();

const buttons = computed(() => props.items.map(
  (item) => {
    let { value, text } = item;

    if (typeof item === 'boolean') {
      value = item;
      text = item ? t('yes') : t('no');
    }

    if (typeof item === 'string' || typeof item === 'number') {
      value = item;
      text = `${item}`;
    }

    return {
      ...item,
      value,
      text,
      size: 'small',
    };
  },
));
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
