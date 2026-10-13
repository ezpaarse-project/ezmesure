<template>
  <v-dialog
    v-model="show"
    :width="initialLoading ? 200 : 1200"
    scrollable
  >
    <LoaderCard v-if="initialLoading" />

    <v-card v-else-if="errorMessage">
      <v-empty-state
        :icon="errorIcon"
        :title="errorMessage"
      >
        <template #actions>
          <v-btn
            :text="$t('close')"
            variant="text"
            @click="show = false"
          />

          <v-btn
            :text="$t('retry')"
            :loading="loading"
            variant="elevated"
            color="secondary"
            @click="refresh"
          />
        </template>
      </v-empty-state>
    </v-card>

    <v-card
      v-else
      :title="title"
      :subtitle="subtitle"
      :loading="loading"
    >
      <template #append>
        <div class="d-flex align-center ga-2">
          <SpaceAddMenu
            v-model:open="addMenuOpened"
            :model-value="spaces"
            :title="$t('dashboardCollections.addToASpace')"
            :loading-items="loadingSpaces"
            @add-space="addSpace($event)"
            @update:model-value="refresh()"
          >
            <template #activator="{ props: menu }">
              <v-btn
                v-tooltip="$t('add')"
                icon="$mdi-plus"
                variant="text"
                color="success"
                density="comfortable"
                v-bind="menu"
              />
            </template>
          </SpaceAddMenu>

          <v-text-field
            v-model="query.search"
            :placeholder="$t('search')"
            append-inner-icon="$mdi-magnify"
            variant="outlined"
            density="compact"
            width="200"
            hide-details
            class="mr-2"
            @update:model-value="debouncedRefresh()"
          />
        </div>
      </template>

      <v-empty-state
        v-if="!hasSpaces"
        :title="$t('dashboardCollections.spacesDialog.empty.title')"
        :text="$t('dashboardCollections.spacesDialog.empty.text')"
      >
        <template #actions>
          <v-btn
            :text="$t('dashboardCollections.spacesDialog.empty.action')"
            size="small"
            variant="tonal"
            prepend-icon="$mdi-folder-plus"
            @click="addMenuOpened = true"
          />
        </template>
      </v-empty-state>

      <v-data-table-server
        v-else
        :headers="headers"
        :search="search"
        :items="spacesData.spaces"
        :loading="loading"
        :no-data-text="t('spaces.search.empty')"
        :sort-by="[{ key: 'name', order: 'asc' }]"
        density="comfortable"
        v-bind="vDataTableOptions"
      >
        <template #[`item.actions`]=" { item }">
          <v-btn
            v-tooltip="$t('delete')"
            color="red"
            density="comfortable"
            icon="$mdi-delete"
            size="small"
            variant="text"
            :loading="loadingSpaces.has(item.spaceId)"
            @click="removeSpace(item)"
          />
        </template>

        <template #[`item.space.name`]=" { item, value }">
          <v-list-item class="pl-0" :title="value">
            <template #subtitle>
              <SpaceSubtitle :model-value="item.space" />
            </template>
          </v-list-item>
        </template>

        <template #[`item.repository.pattern`]=" { item, value }">
          <v-list-item class="pl-0" :title="value">
            <template #subtitle>
              <RepositoryTypeChip :model-value="item.repository" />
            </template>
          </v-list-item>
        </template>
      </v-data-table-server>

      <template #actions>
        <v-btn
          :text="$t('close')"
          variant="text"
          @click="show = false"
        />
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { getErrorMessage } from '@/lib/errors';

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: undefined,
  },
  subtitle: {
    type: String,
    default: undefined,
  },
});

const show = defineModel({ type: Boolean, default: false });

const addMenuOpened = shallowRef(false);
const search = shallowRef('');

const snacks = useSnacksStore();
const { t } = useI18n();

const {
  refresh,
  itemLength,
  query,
  data: spacesData,
  pending: loading,
  error,
  vDataTableOptions,
} = useServerSidePagination({
  fetch: {
    url: () => `/api/dashboard-collections/${props.collectionId}/spaces`,
    query: {
      include: ['space', 'repository'],
    },
  },
  data: {
    sortBy: [
      { key: 'spaceId', order: 'asc' },
    ],
  },
});

const debouncedRefresh = useDebounceFn(refresh, 250);

const spaces = computed(() => spacesData.value ?? []);
const hasSpaces = computed(() => itemLength.value.total > 0);

const title = computed(() => {
  if (props.title) { return props.title; }

  let count = `${itemLength.value.current}`;
  if (itemLength.value.current !== itemLength.value.total) {
    count = `${itemLength.value.current}/${itemLength.value.total}`;
  }
  return t('spaces.toolbarTitle', { count: count ?? '?' });
});

const subtitle = computed(() => props.subtitle ?? spacesData.value.name);

const errorMessage = computed(() => (error.value ? getErrorMessage(error.value) : undefined));
const errorIcon = computed(() => (error?.value?.status === 404 ? '$mdi-ghost-outline' : '$mdi-alert-circle'));

const initialLoading = shallowRef(true);
whenever(() => loading.value === false, () => {
  initialLoading.value = false;
});

whenever(show, () => {
  initialLoading.value = true;
  itemLength.value = { total: 0, current: 0 };
  refresh();
});

const loadingSpaces = ref(new Set());

const headers = computed(() => [
  {
    title: t('name'),
    value: 'space.name',
    sortable: true,
  },
  {
    title: t('repositories.pattern'),
    value: 'repository.pattern',
    sortable: true,
    width: '30%',
  },
  {
    value: 'actions',
    align: 'end',
    width: '70px',
  },
]);

async function addSpace({ space, pattern }) {
  if (!space?.id || loadingSpaces.value.has(space.id)) {
    return;
  }

  loadingSpaces.value.add(space.id);

  try {
    await $fetch(`/api/dashboard-collections/${props.collectionId}/spaces/${space.id}`, {
      method: 'PUT',
      body: {
        repositoryPattern: pattern,
      },
    });

    refresh();
  } catch (err) {
    snacks.error(t('dashboards.cannotAddToCollection'), err);
  }

  loadingSpaces.value.delete(space.id);
}

async function removeSpace(spaceCollection) {
  const spaceId = spaceCollection?.spaceId;
  const repositoryPattern = spaceCollection?.repositoryPattern;

  if (!spaceId || loadingSpaces.value.has(spaceId)) {
    return;
  }

  loadingSpaces.value.add(spaceId);

  try {
    await $fetch(`/api/dashboard-collections/${props.collectionId}/spaces/${spaceId}`, {
      method: 'DELETE',
      body: {
        repositoryPattern,
      },
    });

    refresh();
  } catch (e) {
    snacks.error(t('dashboards.cannotRemoveFromCollection'), e);
  }

  loadingSpaces.value.delete(spaceId);
}

</script>
