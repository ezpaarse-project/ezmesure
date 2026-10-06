<template>
  <v-menu
    v-model="isOpen"
    :close-on-content-click="false"
    width="500"
  >
    <template #activator="menu">
      <slot name="activator" v-bind="menu" />
    </template>

    <v-card
      :title="props.title"
      :subtitle="props.subtitle"
      :loading="status === 'pending' && 'primary'"
      prepend-icon="$mdi-folder-plus"
      min-height="250"
    >
      <template #append>
        <v-btn variant="text" icon="$mdi-close" @click="isOpen = false" />
      </template>

      <template #text>
        <v-text-field
          v-model="search"
          :label="$t('search')"
          :error="!!error"
          :error-messages="error"
          prepend-inner-icon="$mdi-magnify"
          density="compact"
          variant="outlined"
          hide-details
          autofocus
        />

        <v-empty-state
          v-if="!dashboardTemplates || dashboardTemplates.length <= 0"
          icon="$mdi-magnify"
          :title="$t('dashboardCollections.search.empty')"
        />

        <v-list
          v-else
          class="px-0"
          density="compact"
        >
          <v-list-item
            v-for="dashboard in dashboardTemplates"
            :key="dashboard.id"
            :title="dashboard.name"
            :subtitle="dashboard.description"
            :disabled="selectedDashboards.has(dashboard.id)"
            class="rounded bg-surface-light border-thin mt-2"
            lines="two"
          >
            <template #title="{ title: itemTitle }">
              <div>{{ itemTitle }}</div>
              <div class="d-flex flex-wrap ga-1 py-1">
                <v-chip
                  v-for="tag in dashboard.tags"
                  :key="tag.id"
                  v-tooltip:top="tag.attributes.description"
                  :text="tag.attributes.name"
                  :color="tag.attributes.color"
                  class=""
                  variant="flat"
                  size="x-small"
                  label
                />
              </div>
            </template>

            <template v-if="!selectedDashboards.has(dashboard.id)" #append>
              <v-list-item-action>
                <v-btn
                  :loading="props.loadingItems.has(dashboard.id)"
                  icon="$mdi-view-grid-plus"
                  color="primary"
                  variant="tonal"
                  size="small"
                  @click="addDashboardTemplate(dashboard)"
                />
              </v-list-item-action>
            </template>
          </v-list-item>
        </v-list>
      </template>
    </v-card>
  </v-menu>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: undefined,
  },
  subtitle: {
    type: String,
    default: undefined,
  },
  loadingItems: {
    type: Set,
    default: () => new Set(),
  },
});

const affectedDashboards = defineModel({ type: Array, default: () => [] });

const emit = defineEmits({
  'add-dashboard': (payload) => (payload?.id),
});

const isOpen = defineModel('open', { type: Boolean, default: false });

const search = shallowRef('');
const debouncedSearch = refDebounced(search, 250);

const selectedDashboards = computed(() => new Set(affectedDashboards.value.map((i) => i.id)));

const {
  data: dashboardTemplates,
  status,
  error,
} = await useFetch('/api/dashboard-templates', {
  query: {
    q: debouncedSearch,
  },
});

function addDashboardTemplate(dashboard) {
  emit('add-dashboard', dashboard);
}
</script>
