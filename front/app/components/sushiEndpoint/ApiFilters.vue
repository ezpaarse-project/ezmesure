<template>
  <div>
    <v-toolbar
      :title="$t('endpoints.filters.title')"
      style="background-color: transparent;"
    >
      <template #prepend>
        <v-icon icon="$mdi-api" end />
      </template>

      <template #append>
        <v-btn
          v-tooltip="$t('reset')"
          icon="$mdi-filter-off"
          @click="clearFilters"
        />

        <v-btn
          icon="$mdi-close"
          @click="$emit('update:show', false)"
        />
      </template>
    </v-toolbar>

    <v-container>
      <v-row>
        <v-col cols="12">
          <ApiFiltersSelect
            v-model="tags"
            v-model:mode="tagsMode"
            :items="availableTags"
            :label="$t('endpoints.tags')"
            :loading="loadingTags && 'primary'"
            :empty-symbol="emptySymbol"
            prepend-icon="$mdi-tag"
            chips
            closable-chips
            multiple
          />
        </v-col>

        <v-col cols="6">
          <ApiFiltersButtonsGroup
            v-model="inRegistry"
            :label="$t('endpoints.inRegistry')"
            prepend-icon="$mdi-view-grid-plus"
          />
        </v-col>

        <v-col cols="6">
          <ApiFiltersButtonsGroup
            v-model="filters.compliant"
            :label="$t('endpoints.compliant')"
            prepend-icon="$mdi-check-decagram"
          />
        </v-col>

        <v-col cols="6">
          <ApiFiltersButtonsGroup
            v-model="filters.active"
            :label="$t('endpoints.active')"
            prepend-icon="$mdi-api"
          />
        </v-col>

        <v-col cols="12">
          <ApiFiltersSelect
            v-model="filters.counterVersions"
            v-model:loose="filters['counterVersions[some]']"
            :items="SUPPORTED_COUNTER_VERSIONS"
            :label="$t('endpoints.counterVersion')"
            :return-object="false"
            multiple
            prepend-icon="$mdi-numeric"
          >
            <template #selection="{ item: { value: version } }">
              <v-chip
                :text="version"
                :color="counterVersionsColors.get(version) || 'secondary'"
                density="comfortable"
                variant="flat"
                label
                class="text-black"
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

const snacks = useSnacksStore();
const { t, locale } = useI18n();

const {
  emptySymbol,
  filters,
  resetFilters,
  defineStringFilter,
  defineArrayFilter,
} = useFilters(() => props.modelValue, emit);

const loadingTags = shallowRef(false);

const { state: tags, modifier: tagsMode } = defineArrayFilter('tags');

// Transform registry filter into a boolean
const { state: registryId, modifier: registryMode } = defineStringFilter('registryId');
const inRegistry = computed({
  get: () => {
    if (registryId.value === undefined) {
      return undefined;
    }
    return registryMode.value === 'not';
  },
  set: (value) => {
    if (value === undefined) {
      registryId.value = undefined;
      return;
    }
    registryId.value = emptySymbol;
    registryMode.value = value ? 'not' : '';
  },
});

const availableTags = computedAsync(
  async (onCancel) => {
    const abortController = new AbortController();
    onCancel(() => abortController.abort());

    try {
      const data = await $fetch('/api/sushi-endpoints', {
        signal: abortController.signal,
        query: {
          size: 0,
          distinct: 'tags',
        },
      });

      // Merge all tags in one array them make unique
      const items = new Set(data.flatMap((item) => item.tags ?? []));

      return Array.from(items)
        .sort((a, b) => a.localeCompare(b, locale.value, { sensitivity: 'base' }));
    } catch (err) {
      snacks.error(t('anErrorOccurred'), err);
      return [];
    }
  },
  [],
  { lazy: true, evaluating: loadingTags },
);
function clearFilters() {
  resetFilters();
  emit('update:show', false);
}
</script>
