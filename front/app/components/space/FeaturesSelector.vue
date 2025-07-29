<template>
  <div class="d-flex justify-end ga-2 px-2">
    <v-btn
      v-if="!allEnabled"
      :text="$t('enableAll')"
      size="x-small"
      variant="tonal"
      @click="enableAll"
    />
    <v-btn
      v-if="!allDisabled"
      :text="$t('disableAll')"
      size="x-small"
      variant="tonal"
      @click="disableAll"
    />
  </div>

  <v-treeview
    :model-value="enabledFeatures"
    :items="availableFeatures"
    item-value="id"
    item-title="name"
    select-strategy="classic"
    selectable
    @update:model-value="onSelectionChange($event)"
  />
</template>

<script setup>
const { modelValue: disabledFeatures } = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
});

const sortByOrder = (a, b) => (a.order < b.order ? -1 : 1);

const emit = defineEmits({
  'update:modelValue': (features) => Array.isArray(features) && features.every((f) => typeof f === 'string'),
});

const features = computedAsync(async () => {
  try {
    return { items: await $fetch('/api/kibana/api/features') };
  } catch (err) {
    return { error: getErrorMessage(err) };
  }
}, { loading: true });

// Workaround because selection does not sync when items are loaded asynchronously
watch(() => features.value.items, () => {
  nextTick(() => {
    emit('update:modelValue', [...disabledFeatures]);
  });
});

const availableFeatures = computed(() => {
  if (!Array.isArray(features.value?.items)) {
    return [];
  }

  const categories = new Map();

  return features.value.items
    .toSorted(sortByOrder)
    .reduce((acc, feature) => {
      let category = categories.get(feature.category.id);

      if (category) {
        category.children.push({ id: feature.id, name: feature.name });
        return acc;
      }

      category = {
        id: feature.category.id,
        name: feature.category.label,
        order: feature.category.order,
        children: [{ id: feature.id, name: feature.name }],
      };
      categories.set(feature.category.id, category);

      return [...acc, category];
    }, [])
    .toSorted(sortByOrder)
    .map((category) => {
      if (category.children.length === 1) {
        return category.children[0];
      }
      return category;
    });
});

const featureIds = computed(() => (features.value?.items ?? []).map((f) => f.id));

const enabledFeatures = computed(() => {
  const disabled = new Set(disabledFeatures);
  return featureIds.value.filter((f) => !disabled.has(f));
});

const disableAll = () => {
  emit('update:modelValue', availableFeatures.value.flatMap((category) => {
    if (category.children) {
      return category.children.map((feature) => feature.id);
    }
    return [category.id];
  }));
};

const enableAll = () => {
  emit('update:modelValue', []);
};

const onSelectionChange = (selected) => {
  const enabled = new Set(selected);
  emit('update:modelValue', featureIds.value.filter((f) => !enabled.has(f)));
};

const allDisabled = computed(() => disabledFeatures.length === featureIds.value.length);
const allEnabled = computed(() => disabledFeatures.length === 0);
</script>

<style scoped>
  .v-treeview::v-deep .v-list-item--active:not(:hover) .v-list-item__overlay {
    background: none;
  }
</style>
