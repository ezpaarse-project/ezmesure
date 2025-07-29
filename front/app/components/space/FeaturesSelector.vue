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

  <v-alert
    v-if="errorMessage && !loading"
    :title="$t('anErrorOccurred')"
    color="error"
    variant="tonal"
    class="ma-2"
  >
    <div>{{ errorMessage }}</div>

    <v-btn
      block
      size="small"
      variant="outlined"
      @click="refresh()"
    >
      {{ $t('retry') }}
    </v-btn>
  </v-alert>

  <v-skeleton-loader
    type="list-item-avatar, list-item-avatar, list-item-avatar"
    :loading="loading"
  >
    <v-treeview
      :model-value="Array.from(enabledFeatures)"
      :items="availableFeatures"
      density="compact"
      expand-icon="mdi-chevron-right"
      collapse-icon="mdi-chevron-down"
      item-value="id"
      item-title="name"
      select-strategy="classic"
      selectable
      @update:model-value="onSelectionChange($event)"
    >
      <template #append="{ item }">
        <span v-if="item?.children" class="text-caption text-grey">
          {{ nbActiveChildren.get(item.id) }} / {{ item.children.length }}
        </span>
      </template>
    </v-treeview>
  </v-skeleton-loader>
</template>

<script setup>
import { getErrorMessage } from '@/lib/errors';

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

const {
  data: features,
  status,
  error,
  refresh,
} = useAsyncData('features', () => $fetch('/api/kibana/api/features'));

const loading = computed(() => status.value === 'pending');
const errorMessage = computed(() => error.value && getErrorMessage(error.value));

// Workaround because selection does not sync when items are loaded asynchronously
watch(() => features.value, () => {
  nextTick(() => {
    emit('update:modelValue', [...disabledFeatures]);
  });
}, { once: true });

const availableFeatures = computed(() => {
  if (!Array.isArray(features.value)) {
    return [];
  }

  const categories = new Map();

  return features.value
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

const featureIds = computed(() => (features.value ?? []).map((f) => f.id));

const enabledFeatures = computed(() => {
  const disabled = new Set(disabledFeatures);
  return new Set(featureIds.value.filter((f) => !disabled.has(f)));
});

const isEnabled = (feature) => enabledFeatures.value.has(feature.id);

const nbActiveChildren = computed(() => new Map(
  availableFeatures.value.map((category) => [
    category.id,
    (category.children ?? []).filter(isEnabled).length,
  ]),
));

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
