<template>
  <div>
    <SkeletonPageBar
      v-model="query"
      :title="toolbarTitle"
      :refresh="refresh"
      search
      icons
      @update:model-value="debouncedRefresh()"
    >
      <v-btn
        v-tooltip="$t('add')"
        icon="mdi-plus"
        variant="tonal"
        density="comfortable"
        color="green"
        class="mr-2"
        @click="openCollectionForm()"
      />
    </SkeletonPageBar>

    <v-container fluid>
      <v-row>
        <v-col>
          <p>{{ $t('dashboardCollections.pageDesc') }}</p>
        </v-col>
      </v-row>
    </v-container>

    <v-data-table-server
      v-model="selectedCollections"
      :headers="headers"
      show-select
      return-object
      v-bind="vDataTableOptions"
    >
      <template #[`item._count.dashboards`]="{ value }">
        <v-chip
          :text="`${value ?? 0}`"
          :variant="!value ? 'outlined' : undefined"
          prepend-icon="mdi-view-dashboard"
          size="small"
        />
      </template>

      <template #[`item._count.spaces`]="{ value }">
        <v-chip
          :text="`${value ?? 0}`"
          :variant="!value ? 'outlined' : undefined"
          prepend-icon="mdi-folder-outline"
          size="small"
        />
      </template>

      <template #[`item.actions`]="{ item }">
        <v-menu>
          <template #activator="{ props: menu }">
            <v-btn
              icon="mdi-cog"
              variant="plain"
              density="compact"
              v-bind="menu"
            />
          </template>

          <v-list>
            <v-list-item
              :title="$t('modify')"
              prepend-icon="mdi-pencil"
              @click="openCollectionForm(item.id)"
            />
            <v-list-item
              :title="$t('delete')"
              prepend-icon="mdi-delete"
              @click="deleteCollections([item])"
            />

            <v-divider />

            <v-list-item
              v-if="clipboard"
              :title="$t('copyId')"
              prepend-icon="mdi-identifier"
              @click="copyToClipboard(item.id)"
            />
          </v-list>
        </v-menu>
      </template>
    </v-data-table-server>

    <SelectionMenu
      v-model="selectedCollections"
      :text="$t('dashboardCollections.manageCollections', selectedCollections.length)"
    >
      <template #actions>
        <v-list-item
          :title="$t('delete')"
          prepend-icon="mdi-delete"
          @click="deleteCollections()"
        />
      </template>
    </SelectionMenu>
  </div>
</template>

<script setup>
import DashboardCollectionFormDialog from '~/components/dashboardCollection/FormDialog.vue';

definePageMeta({
  layout: 'admin',
  middleware: ['require-auth', 'require-terms', 'require-admin'],
});

const { t } = useI18n();
const { isSupported: clipboard, copy } = useClipboard();
const { openConfirm } = useConfirmStore();
const { openDialog } = useDialogStore();
const snacks = useSnacksStore();

const selectedCollections = ref([]);

const {
  refresh,
  itemLength,
  query,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: '/api/dashboard-collections',
    query: {
      include: ['_count.dashboards', '_count.spaces'],
    },
  },
  sortMapping: {
    dashboards: 'dashboards._count',
    spaces: 'spaces._count',
  },
  data: {
    sortBy: [
      { key: 'name', order: 'asc' },
      { key: 'createdAt', order: 'desc' },
    ],
  },
});

/**
 * Table headers
 */
const headers = computed(() => [
  {
    title: t('name'),
    value: 'name',
    sortable: true,
  },
  {
    title: t('description'),
    value: 'description',
    sortable: true,
  },
  {
    title: t('dashboards.templates'),
    value: '_count.dashboards',
    align: 'center',
    sortable: true,
  },
  {
    title: t('spaces.spaces'),
    value: '_count.spaces',
    sortable: true,
  },
  {
    title: t('actions'),
    value: 'actions',
    align: 'center',
  },
]);
/**
 * Toolbar title
 */
const toolbarTitle = computed(() => {
  let count = `${itemLength.value.current}`;
  if (itemLength.value.current !== itemLength.value.total) {
    count = `${itemLength.value.current}/${itemLength.value.total}`;
  }
  return t('dashboardCollections.toolbarTitle', { count: count ?? '?' });
});

/**
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(refresh, 250);

function openCollectionForm(collectionId) {
  openDialog({
    component: DashboardCollectionFormDialog,
    data: { collectionId },
    listeners: {
      submit: () => {
        debouncedRefresh();
      },
    },
  });
}

/**
 * Delete multiple spaces
 *
 * @param {Object[]} [items] List of items to delete, if none it'll fall back to selected
 */
function deleteCollections(items) {
  const toDelete = items || selectedCollections.value;

  if (toDelete.length <= 0) {
    return;
  }

  openConfirm({
    title: t('dashboardCollections.actions.delete.title', toDelete.length),
    text: t('dashboardCollections.actions.delete.text'),
    agreeText: t('delete'),
    agreeIcon: 'mdi-delete',
    onAgree: async () => {
      const results = await Promise.all(
        toDelete.map(
          (item) => $fetch(`/api/dashboard-collections/${item.id}`, { method: 'DELETE' })
            .catch((err) => {
              snacks.error(t('cannotDeleteItem', { id: item.id }), err);
              return null;
            }),
        ),
      );

      if (!results.some((r) => !r)) {
        snacks.success(t('itemsDeleted', { count: toDelete.length }));
      }

      if (!items) {
        selectedCollections.value = [];
      }

      await refresh();
    },
  });
}

/**
 * Copy text into the clipboard
 *
 * @param {object} text - The text we want to copy
 */
async function copyToClipboard(text) {
  if (!text) { return; }

  try {
    await copy(text);
  } catch (err) {
    snacks.error(t('clipboard.unableToCopy'), err);
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}
</script>
