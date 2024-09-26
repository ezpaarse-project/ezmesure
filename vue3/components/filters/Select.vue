<template>
  <v-select
    :model-value="modelValue === '' ? $t('permissions.none') : modelValue"
    :items="selectItems"
    variant="outlined"
    density="comfortable"
    hide-details="auto"
    multiple
    @update:model-value="$emit('update:modelValue', $event || [])"
  >
    <template #prepend-item>
      <v-list-item
        :title="$t('permissions.none')"
        :disabled="isEmptyDisabled"
        @click="toggle()"
      >
        <template #prepend>
          <v-checkbox-btn
            :model-value="isEmptyActive"
            :ripple="false"
            color="primary"
            readonly
          />
        </template>
      </v-list-item>

      <v-divider class="mb-2" />
    </template>
  </v-select>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: [Array, String],
    default: () => undefined,
  },
  items: {
    type: Array,
    default: () => undefined,
  },
  emptySymbol: {
    type: Symbol,
    required: true,
  },
});

const emit = defineEmits({
  'update:modelValue': (v) => Array.isArray(v) || typeof v === 'string' || v === undefined,
});

const isEmptyActive = computed(
  () => (Array.isArray(props.modelValue) && props.modelValue?.includes(props.emptySymbol))
    || props.modelValue === '',
);
const isEmptyDisabled = computed(
  () => Array.isArray(props.modelValue)
    && (props.modelValue?.length ?? 0) > 0
    && !isEmptyActive.value,
);
const selectItems = computed(() => {
  if (!props.items) {
    return undefined;
  }

  return props.items.map((item) => ({
    ...item,
    props: {
      disabled: isEmptyActive.value,
      color: 'primary',
      ...(item.props ?? {}),
    },
  }));
});

function toggle() {
  if (isEmptyActive.value) {
    emit('update:modelValue', []);
    return;
  }
  emit('update:modelValue', [props.emptySymbol]);
}
</script>
