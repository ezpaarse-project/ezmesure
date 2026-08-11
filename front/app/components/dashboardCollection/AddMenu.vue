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
          v-if="!collections || collections.length <= 0"
          icon="$mdi-magnify"
          :title="$t('dashboardCollections.search.empty')"
        />

        <v-list
          v-else
          class="px-0"
          density="compact"
        >
          <v-list-item
            v-for="collection in collections"
            :key="collection.id"
            :title="collection.name"
            :subtitle="collection.description"
            :disabled="selectedCollections.has(collection.id)"
            class="rounded bg-surface-light border-thin mt-2"
            lines="two"
          >
            <template v-if="!selectedCollections.has(collection.id)" #append>
              <v-menu
                location="start center"
                min-width="250px"
              >
                <template #activator="{ props: menuProps }">
                  <v-btn
                    :loading="props.loadingItems.has(collection.id)"
                    icon="$mdi-folder-plus"
                    color="primary"
                    variant="tonal"
                    size="small"
                    v-bind="menuProps"
                  />
                </template>

                <v-card v-if="!hasRepositories" class="text-center">
                  <template #text>
                    {{ $t('dashboardCollections.noRepositories') }}
                  </template>
                </v-card>

                <v-list v-else density="compact">
                  <v-list-subheader>
                    {{ $t('dashboardCollections.repositorySelection') }}
                  </v-list-subheader>

                  <v-list-item
                    v-for="(pattern, index) in props.repositoryPatterns"
                    :key="index"
                    :value="pattern"
                    :title="pattern"
                    prepend-icon="$mdi-database"
                    @click="addCollection(collection, pattern)"
                  />
                </v-list>
              </v-menu>
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
  repositoryPatterns: {
    type: Array,
    default: () => [],
  },
  loadingItems: {
    type: Set,
    default: () => new Set(),
  },
});

const affectedCollections = defineModel({ type: Array, default: () => [] });

const emit = defineEmits({
  'add-collection': (payload) => (payload?.collection?.id && payload?.pattern),
});

const isOpen = defineModel('open', { type: Boolean, default: false });

const search = shallowRef('');
const debouncedSearch = refDebounced(search, 250);

const selectedCollections = computed(() => new Set(affectedCollections.value.map((i) => i.id)));

const hasRepositories = computed(
  () => Array.isArray(props.repositoryPatterns) && props.repositoryPatterns.length > 0,
);

const {
  data: collections,
  status,
  error,
} = await useFetch('/api/dashboard-collections', {
  query: {
    q: debouncedSearch,
  },
});

function addCollection(collection, pattern) {
  emit('add-collection', { collection, pattern });
}
</script>
