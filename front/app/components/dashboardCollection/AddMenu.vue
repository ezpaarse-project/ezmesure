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
              <RepositoryPicker
                :institution-id="props.institutionId"
                :type="props.spaceType"
                @select:repository="addCollection(collection, { repository: $event })"
                @select:alias="addCollection(collection, { alias: $event })"
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
              </RepositoryPicker>
            </template>
          </v-list-item>
        </v-list>
      </template>
    </v-card>
  </v-menu>
</template>

<script setup>
const props = defineProps({
  institutionId: {
    type: String,
    required: true,
  },
  spaceType: {
    type: String,
    default: () => '',
  },
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

const affectedCollections = defineModel({ type: Array, default: () => [] });

const emit = defineEmits({
  'add-collection': (payload) => (
    payload?.collection?.id && (payload?.repositoryPattern ?? payload?.aliasPattern)
  ),
});

const isOpen = defineModel('open', { type: Boolean, default: false });

const search = shallowRef('');
const debouncedSearch = refDebounced(search, 250);

const selectedCollections = computed(() => new Set(affectedCollections.value.map((i) => i.id)));

const {
  data: collections,
  status,
  error,
} = await useFetch('/api/dashboard-collections', {
  query: {
    q: debouncedSearch,
  },
});

/**
 * @param {object} collection - The collection to add
 * @param {object} repoOptions - The repository options
 * @param {string} [repoOptions.repository] - The repository to use
 * @param {string} [repoOptions.alias] - The alias to use
 */
function addCollection(collection, { repository, alias }) {
  emit('add-collection', {
    collection,
    repositoryPattern: repository?.pattern,
    aliasPattern: alias?.pattern,
  });
}
</script>
