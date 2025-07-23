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
          <ApiFiltersSelect
            v-model="filters.tags"
            v-model:loose="filters['tags:loose']"
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
          <ApiFiltersButtonsGroup
            v-model="isDisabled"
            :label="$t('endpoints.disabled')"
            prepend-icon="mdi-download-off"
          />
        </v-col>

        <v-col cols="6">
          <ApiFiltersButtonsGroup
            v-model="filters.active"
            :label="$t('endpoints.active')"
            prepend-icon="mdi-toggle-switch"
          />
        </v-col>

        <v-col cols="12">
          <ApiFiltersSelect
            v-model="filters.counterVersions"
            v-model:loose="filters['counterVersions:loose']"
            :items="Object.keys(SUPPORTED_COUNTER_VERSIONS)"
            :label="$t('endpoints.counterVersion')"
            :return-object="false"
            multiple
            prepend-icon="mdi-numeric"
          >
            <template #selection="{ item: { value: version } }">
              <v-chip
                :text="version"
                :color="counterVersionsColors.get(version) || 'secondary'"
                density="comfortable"
                variant="flat"
                label
              />
            </template>
          </ApiFiltersSelect>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { SUPPORTED_COUNTER_VERSIONS } from '@/lib/sushi';

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
  async (onCancel) => {
    const abortController = new AbortController();
    onCancel(() => abortController.abort());

    const items = await $fetch('/api/sushi-endpoints', {
      signal: abortController.signal,
      query: {
        size: 0,
        distinct: 'tags',
      },
    });

    // Merge all tags in one array them make unique
    const tags = new Set(items.flatMap((item) => item.tags ?? []));

    return Array.from(tags)
      .sort((a, b) => a.localeCompare(b, locale.value, { sensitivity: 'base' }));
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
