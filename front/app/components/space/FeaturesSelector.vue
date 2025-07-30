<template>
  <div class="d-flex justify-end ga-2">
    <v-btn
      v-if="!allSelected"
      :text="$t('selectAll')"
      size="x-small"
      variant="tonal"
      @click="selectAll"
    />
    <v-btn
      v-if="!noneSelected"
      :text="$t('deselectAll')"
      size="x-small"
      variant="tonal"
      @click="deselectAll"
    />
  </div>

  <v-treeview
    :model-value="props.modelValue"
    :items="availableFeatures"
    item-value="id"
    item-title="name"
    select-strategy="classic"
    selectable
    @update:model-value="$emit('update:modelValue', $event);"
  />
</template>

<script setup>
const props = defineProps({
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
    emit('update:modelValue', [...props.modelValue]);
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

const selectAll = () => {
  emit('update:modelValue', availableFeatures.value.flatMap((category) => {
    if (category.children) {
      return category.children.map((feature) => feature.id);
    }
    return [category.id];
  }));
};

const deselectAll = () => {
  emit('update:modelValue', []);
};

const allSelected = computed(() => props.modelValue.length === availableFeatures.value.length);
const noneSelected = computed(() => props.modelValue.length === 0);
</script>
