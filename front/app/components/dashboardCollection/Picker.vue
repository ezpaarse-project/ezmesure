<template>
  <v-menu
    v-model="isOpen"
    :close-on-content-click="false"
    transition="slide-x-reverse-transition"
    width="600"
  >
    <template #activator="menu">
      <slot name="activator" v-bind="menu" />
    </template>

    <v-card
      :loading="(props.loading || status === 'pending') && 'primary'"
      min-height="250"
    >
      <v-text-field
        v-model="search"
        append-inner-icon="mdi-magnify"
        :label="$t('search')"
        :error="!!error"
        :error-messages="error"
        hide-details
      />

      <v-container>
        <v-empty-state
          v-if="!collections || collections.length <= 0"
          icon="mdi-monitor-dashboard"
          :title="$t('dashboardCollections.search.empty')"
        />

        <v-list
          v-else
          :selected="[selectedCollection?.id]"
          color="info"
          class="pa-0"
          density="compact"
        >
          <v-list-item
            :title="$t('dashboards.noCollection')"
            class="rounded border-dashed border-thin mt-2 text-center"
            @click="selectCollection(null)"
          />
          <v-list-item
            v-for="collection in collections"
            :key="collection.id"
            :title="collection.name"
            :subtitle="collection.description"
            :value="collection.id"
            class="rounded border-thin mt-2"
            lines="two"
            @click="selectCollection(collection)"
          />
        </v-list>
      </v-container>
    </v-card>
  </v-menu>
</template>

<script setup>
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
});

const selectedCollection = defineModel({ type: Object, default: () => ({}) });

const isOpen = shallowRef(false);
const search = shallowRef('');
const debouncedSearch = refDebounced(search, 250);

const {
  data: collections,
  status,
  error,
} = await useFetch('/api/dashboard-collections', {
  query: {
    q: debouncedSearch,
  },
});

function selectCollection(collection) {
  selectedCollection.value = collection;
  isOpen.value = false;
}
</script>
