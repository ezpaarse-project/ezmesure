<template>
  <div>
    <v-toolbar
      :title="$t('sushi.filters.title')"
      style="background-color: transparent;"
    >
      <template #prepend>
        <v-icon icon="mdi-key" end />
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
        <v-col v-if="institution" cols="12">
          <ApiFiltersSelect
            v-model="filters.endpointId"
            :search="filters.search"
            :disabled="!!filters.search"
            :messages="filters.search ? $t('users.filters.searchHint') : undefined"
            :items="availableEndpoints"
            :label="$t('institutions.sushi.endpoint')"
            :loading="loadingEndpoints && 'primary'"
            prepend-icon="mdi-api"
            clearable
          />
        </v-col>

        <v-col v-if="institution" cols="12">
          <ApiFiltersSelect
            v-model="filters.packages"
            v-model:loose="filters['packages:loose']"
            :items="availablePackages"
            :label="$t('institutions.sushi.packages')"
            :loading="loadingPackages && 'primary'"
            :empty-symbol="emptySymbol"
            chips
            closable-chips
            multiple
            prepend-icon="mdi-tag"
          />
        </v-col>

        <v-col cols="12">
          <ApiFiltersButtonsGroup
            v-model="filters.connection"
            :label="$t('status')"
            :items="statuses"
            prepend-icon="mdi-connection"
          />
        </v-col>

        <v-col cols="6">
          <ApiFiltersButtonsGroup
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
  institution: {
    type: Object,
    default: undefined,
  },
});

const emit = defineEmits({
  'update:modelValue': (v) => !!v,
  'update:show': (v) => typeof v === 'boolean',
});

const { t } = useI18n();

const {
  emptySymbol,
  filters,
  resetFilters,
} = useFilters(() => props.modelValue, emit);

const loadingEndpoints = ref(false);
const loadingPackages = ref(false);

const availableEndpoints = computedAsync(
  async () => {
    if (!props.institution) {
      return [];
    }

    const sushiItems = await $fetch(`/api/institutions/${props.institution.id}/sushi`, {
      query: {
        size: 0,
        distinct: 'endpointId',
        include: ['endpoint'],
      },
    });

    // Map sushi items with id of endpoint as key
    const itemsPerEndpoint = Map.groupBy(Object.values(sushiItems), (item) => item.endpointId);

    return Array.from(itemsPerEndpoint)
      .map(([id, items]) => ({ value: id, title: items[0].endpoint.vendor }))
      .sort((a, b) => a.title.localeCompare(b.title));
  },
  [],
  { lazy: true, evaluating: loadingEndpoints },
);

const availablePackages = computedAsync(
  async () => {
    if (!props.institution) {
      return [];
    }

    const sushiItems = await $fetch(`/api/institutions/${props.institution.id}/sushi`, {
      query: {
        size: 0,
        distinct: 'packages',
      },
    });

    // Map sushi items with array of packages as key
    const itemsPerPackages = Map.groupBy(Object.values(sushiItems), (item) => item.packages);
    // Merge all packages in one array then make unique
    const packages = new Set(Array.from(itemsPerPackages.keys()).flat());
    return Array.from(packages).sort();
  },
  [],
  { lazy: true, evaluating: loadingPackages },
);

const statuses = computed(() => {
  const entries = Array.from(sushiStatus.keys());
  return entries.map((key) => {
    let text = 'institutions.sushi';
    switch (key) {
      case 'success':
        text = `${text}.operational`;
        break;
      case 'unauthorized':
        text = `${text}.invalidCredentialsShort`;
        break;
      case 'failed':
        text = 'error';
        break;
      default:
        text = `${text}.untested`;
        break;
    }

    return {
      value: key,
      text: t(text),
    };
  });
});

function clearFilters() {
  resetFilters();
  emit('update:show', false);
}
</script>
