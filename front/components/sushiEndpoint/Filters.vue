<template>
  <div>
    <v-toolbar
      :title="$t('endpoints.filters.title')"
      style="background-color: transparent;"
    >
      <template #prepend>
        <v-icon icon="mdi-api" end />
      </template>

      <template #append>
        <v-btn
          v-tooltip="$t('reset')"
          icon="mdi-filter-off"
          @click="clearFilters"
        />

        <v-btn
          icon="mdi-close"
          @click="$emit('update:show', false)"
        />
      </template>
    </v-toolbar>

    <v-container>
      <v-row>
        <v-col cols="12">
          <FiltersSelect
            v-model="filters.tags"
            :items="availableTags"
            :label="$t('endpoints.tags')"
            :loading="loadingTags && 'primary'"
            :empty-symbol="emptySymbol"
            chips
            closable-chips
            multiple
            prepend-icon="mdi-tag"
          />
        </v-col>

        <v-col cols="6">
          <FiltersButtonsGroup
            v-model="isDisabled"
            :label="$t('endpoints.disabled')"
            prepend-icon="mdi-download-off"
          />
        </v-col>

        <v-col cols="6">
          <FiltersButtonsGroup
            v-model="filters.active"
            :label="$t('endpoints.active')"
            prepend-icon="mdi-toggle-switch"
          />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits({
  'update:modelValue': (v) => !!v,
  'update:show': (v) => typeof v === 'boolean',
});

const {
  emptySymbol,
  filters,
  resetFilters,
} = useFilters(() => props.modelValue, emit);

const loadingTags = ref(false);

const availableTags = computedAsync(
  async () => {
    const sushiItems = await $fetch('/api/sushi-endpoints', {
      query: {
        size: 0,
        distinct: 'tags',
      },
    });

    // Map sushi items with array of tags as key
    const itemsPerTags = Map.groupBy(Object.values(sushiItems), (item) => item.tags);
    // Merge all tags in one array then make unique
    const tags = new Set(Array.from(itemsPerTags.keys()).flat());
    return Array.from(tags).sort();
  },
  [],
  { lazy: true, evaluating: loadingTags },
);

const isDisabled = computed({
  get: () => {
    const value = filters['disabledUntil:from'];
    if (value === '') {
      return false;
    }
    if (!value) {
      return undefined;
    }
    return true;
  },
  set: (value) => {
    if (value === true) {
      filters['disabledUntil:from'] = new Date().toISOString();
    } else if (value === false) {
      filters['disabledUntil:from'] = emptySymbol;
    } else {
      filters['disabledUntil:from'] = undefined;
    }
  },
});

function clearFilters() {
  resetFilters();
  emit('update:show', false);
}
</script>
