<template>
  <div class="d-flex">
    <div v-if="prependIcon" style="width: 24px; margin-right: 1rem">
      <v-icon :icon="prependIcon" color="grey-darken-1" />
    </div>

    <div style="flex: 1">
      <v-label :text="`${label || ''} (${elements.length})`" class="mb-0" />

      <v-slide-x-transition tag="div" group>
        <v-chip
          v-for="(message, i) in errorMessages"
          :key="`err${i}`"
          :text="message"
          prepend-icon="mdi-alert-circle"
          density="comfortable"
          variant="elevated"
          class="value-chip my-1"
          color="error"
        />
      </v-slide-x-transition>

      <v-slide-x-transition ref="scrollerRef" tag="div" group class="container">
        <v-chip
          v-for="(item, i) in elements"
          :key="item.id"
          :closable="!readonly"
          :color="
            (itemErrors.get(item.id)?.length ?? 0) > 0 ? 'error' : undefined
          "
          density="comfortable"
          class="value-chip my-1"
          @click:close="remValue(item.id)"
        >
          <span class="text-overline text-grey mr-2">{{ i + 1 }}.</span>

          <v-text-field
            :model-value="item.value"
            :placeholder="itemPlaceholder"
            density="compact"
            variant="plain"
            hide-details
            class="mb-2"
            @update:model-value="editValue(item.id, $event)"
          />
        </v-chip>
      </v-slide-x-transition>

      <v-chip
        v-if="!readonly"
        :text="addLabel || $t('$ezreeport.addMultiValue')"
        prepend-icon="mdi-plus"
        density="comfortable"
        variant="elevated"
        class="value-chip mt-1"
        color="green"
        @click="addValue()"
      />

      <v-combobox v-model="elements" :rules="rules" multiple class="d-none" />
    </div>
  </div>
</template>

<script setup>
// Component props
const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: () => [],
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  prependIcon: {
    type: String,
    default: undefined,
  },
  label: {
    type: String,
    default: undefined,
  },
  addLabel: {
    type: String,
    default: undefined,
  },
  variant: {
    type: String,
    default: undefined,
  },
  density: {
    type: String,
    default: undefined,
  },
  rules: {
    type: Array,
    default: () => [],
  },
  itemRules: {
    type: Array,
    default: () => [],
  },
  itemPlaceholder: {
    type: String,
    default: undefined,
  },
  count: {
    type: Number,
    default: undefined,
  },
});

// Component events
const emit = defineEmits({
  'update:modelValue': (value) => !value || typeof value === 'string' || (Array.isArray(value) && value.every((v) => typeof v === 'string')),
});

/** @type {Ref<{ id: string; value: string }[]>} */
const rawElements = ref([]);

const scrollerRef = useTemplateRef('scrollerRef');

/** Values as an array */
const elements = computed({
  get: () => rawElements.value,
  set: (val) => {
    rawElements.value = val;

    if (val.length === 1) {
      emit('update:modelValue', val[0].value);
      return;
    }

    if (val.length === 0) {
      emit('update:modelValue');
      return;
    }

    emit(
      'update:modelValue',
      Array.from(new Set(val.map(({ value }) => value))),
    );
  },
});

const containerHeight = computed(
  () => `${Math.min(props.count ?? 6, elements.value.length) * (36 + 2)}px`,
);

/** @type {ComputedRef<string[]>} */
const rulesErrors = computed(() => {
  if (!props.rules) {
    return [];
  }

  const values = elements.value.map(({ value }) => value);

  return props.rules
    .map((rule) => rule(values) || 'Error')
    .filter((val) => val !== true);
});

/** @type {ComputedRef<Map<string, string[]>>} */
const itemErrors = computed(() => {
  if (!props.itemRules) {
    return new Map();
  }

  const rules = props.itemRules;

  return new Map(
    elements.value.map((item, index) => [
      item.id,
      rules
        .map((rule) => rule(item.value, index) || 'Error')
        .filter((val) => val !== true),
    ]),
  );
});

/** Error messages using given rules */
const errorMessages = computed(
  () => new Set([
    ...rulesErrors.value,
    ...Array.from(itemErrors.value.values()).flat(),
  ]),
);

async function scrollToBottom() {
  await nextTick();
  const element = scrollerRef.value?.$el;
  if (!element) {
    return;
  }
  element.scrollTop = element.scrollHeight;
}

/**
 * Add a new value
 */
function addValue() {
  if (elements.value.some(({ value }) => value === '')) {
    return;
  }
  const id = Array.from({ length: 16 }, () => Math.round(Math.random() * 9)).join('');
  const values = [...elements.value, { id, value: '' }];
  elements.value = values;
  scrollToBottom();
}

/**
 * Remove a value
 *
 * @param {string} id
 */
function remValue(id) {
  const values = elements.value.filter(({ id: el }) => el !== id);
  elements.value = values;
}

/**
 * Edit a value
 *
 * @param {string} id
 * @param {string} newValue
 */
function editValue(id, newValue) {
  const values = elements.value.map((el) => {
    if (el.id !== id) {
      return el;
    }
    return { ...el, value: newValue };
  });

  elements.value = values;
}

watch(
  () => props.modelValue,
  (val) => {
    /** @type {string[]} */
    let values = [];
    if (Array.isArray(val)) {
      values = val;
    } else if (val != null) {
      values = [val];
    }

    rawElements.value = values.map((value) => {
      const existingEl = rawElements.value.find(
        ({ value: el }) => el === value,
      );
      if (existingEl) {
        return existingEl;
      }
      const id = Array.from({ length: 16 }, () => Math.round(Math.random() * 9)).join('');
      return { id, value };
    });
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.container {
  height: v-bind('containerHeight');
  overflow-x: auto;
  scroll-behavior: smooth;
}

.value-chip {
  width: 97%;

  :deep(.v-chip__content) {
    width: 100%;

    & > span {
      display: inline-block;
      vertical-align: bottom;
      max-width: 15rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>
