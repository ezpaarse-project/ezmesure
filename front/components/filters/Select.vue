<template>
  <v-autocomplete
    v-model="value"
    v-model:search="search"
    :items="selectItems"
    variant="outlined"
    density="comfortable"
    hide-details="auto"
  >
    <template v-if="emptySymbol && !search" #prepend-item>
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

    <template v-if="$slots.selection" #selection="selection">
      <slot name="selection" v-bind="selection" />
    </template>

    <template v-if="looseEnabled" #append>
      <v-btn
        v-tooltip="loose ? $t('looseFilter') : $t('strictFilter')"
        :icon="loose ? 'mdi-approximately-equal' : 'mdi-equal'"
        density="comfortable"
        @click="emit('update:loose', !loose)"
      />
    </template>
  </v-autocomplete>
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
    default: undefined,
  },
  loose: {
    type: Boolean,
    default: undefined,
  },
});

const emit = defineEmits({
  'update:modelValue': (v) => Array.isArray(v) || typeof v === 'string' || v === undefined,
  'update:loose': (v) => v === true || v === false,
});

const { t } = useI18n();

const search = ref('');

const looseEnabled = computed(() => {
  const { 'onUpdate:loose': looseListener } = getCurrentInstance()?.vnode.props ?? {};
  return !!looseListener;
});

const value = computed({
  get: () => {
    if (props.emptySymbol && props.modelValue === '') {
      return t('permissions.none');
    }
    return props.modelValue;
  },
  set: (v) => emit('update:modelValue', v || []),
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

  return props.items.map((item) => {
    let i = item;
    if (typeof item !== 'object') {
      i = {
        title: item,
        value: item,
      };
    }

    return {
      ...i,
      props: {
        disabled: props.emptySymbol && isEmptyActive.value,
        color: 'primary',
        ...(i.props ?? {}),
      },
    };
  });
});

function toggle() {
  if (isEmptyActive.value) {
    emit('update:modelValue', []);
    return;
  }
  emit('update:modelValue', [props.emptySymbol]);
}
</script>
