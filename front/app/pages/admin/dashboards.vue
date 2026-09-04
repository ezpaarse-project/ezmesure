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
        icon="$mdi-plus"
        variant="tonal"
        density="comfortable"
        color="green"
        class="mr-2"
        @click="openDashboardForm()"
      />
    </SkeletonPageBar>

    <v-container fluid>
      <v-row>
        <v-col>
          <p>{{ $t('dashboards.pageDesc') }}</p>
        </v-col>
      </v-row>
    </v-container>

    <v-data-table-server
      v-model="selectedDashboards"
      :headers="headers"
      show-select
      return-object
      v-bind="vDataTableOptions"
    >
      <template #[`item.collection`]="{ value, item }">
        <DashboardCollectionPicker
          :model-value="item.collection"
          location="left"
          @update:model-value="setCollection($event, item.id)"
        >
          <template #activator="{ props }">
            <v-chip
              :text="`${value?.name ?? '...'}`"
              :variant="!value ? 'outlined' : undefined"
              prepend-icon="$mdi-folder-table"
              size="small"
              v-bind="props"
            />
          </template>
        </DashboardCollectionPicker>
      </template>

      <template #[`item.tags`]="{ value }">
        <div class="d-flex flex-wrap ga-1 py-1">
          <v-chip
            v-for="tag in value"
            :key="tag.id"
            v-tooltip:top="tag.attributes.description"
            :text="tag.attributes.name"
            :color="tag.attributes.color"
            variant="flat"
            size="x-small"
            label
          />
        </div>
      </template>

      <template #[`item.actions`]="{ item }">
        <v-menu>
          <template #activator="{ props: menu }">
            <v-btn
              icon="$mdi-cog"
              variant="plain"
              density="compact"
              v-bind="menu"
            />
          </template>

          <v-list>
            <v-list-item
              :title="$t('modify')"
              prepend-icon="$mdi-pencil"
              @click="openDashboardForm(item.id)"
            />
            <v-list-item
              :title="$t('update')"
              prepend-icon="$mdi-sync"
              @click="updateDashboards([item])"
            />
            <v-list-item
              :title="$t('delete')"
              prepend-icon="$mdi-delete"
              @click="deleteDashboards([item])"
            />

            <v-divider />

            <v-list-item
              v-if="clipboard"
              :title="$t('copyId')"
              prepend-icon="$mdi-identifier"
              @click="copyToClipboard(item.id)"
            />
          </v-list>
        </v-menu>
      </template>
    </v-data-table-server>

    <SelectionMenu
      v-model="selectedDashboards"
      :text="$t('dashboards.manageDashboards', selectedDashboards.length)"
    >
      <template #actions>
        <v-list-item
          :title="$t('update')"
          prepend-icon="$mdi-sync"
          @click="updateDashboards()"
        />
        <v-list-item
          :title="$t('delete')"
          prepend-icon="$mdi-delete"
          @click="deleteDashboards()"
        />
      </template>
    </SelectionMenu>
  </div>
</template>

<script setup>
import DashboardFormDialog from '~/components/dashboard/FormDialog.vue';
import { getErrorMessage } from '@/lib/errors';


const { t } = useI18n();
const { isSupported: clipboard, copy } = useClipboard();
const { openConfirm } = useConfirmStore();
const { openDialog } = useDialogStore();
const snacks = useSnacksStore();

const selectedDashboards = ref([]);

const {
  refresh,
  itemLength,
  query,
  vDataTableOptions,
} = useServerSidePagination({
  fetch: {
    url: '/api/dashboard-templates',
    query: {
      include: ['collection'],
    },
  },
  sortMapping: {
    collection: 'collection.name',
  },
  data: {
    sortBy: [
      { key: 'id', order: 'asc' },
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
    title: t('dashboards.tags'),
    value: 'tags',
    sortable: false,
  },
  {
    title: t('dashboards.kibanaVersion'),
    value: 'kibanaVersion',
    align: 'end',
    width: '170px',
    sortable: true,
  },
  {
    title: t('dashboards.collection'),
    value: 'collection',
    width: '150px',
    sortable: true,
  },
  {
    title: t('actions'),
    value: 'actions',
    width: '100px',
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
  return t('dashboards.toolbarTitle', { count: count ?? '?' });
});

/**
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(refresh, 250);

function openDashboardForm(dashboardId) {
  openDialog({
    component: DashboardFormDialog,
    data: { dashboardId },
    listeners: {
      submit: () => {
        debouncedRefresh();
      },
    },
  });
}

/**
 * Synchronize multiple dashboards, by getting the current version from Kibana
 *
 * @param {Object[]} [items] List of items to delete, if none it'll fall back to selected
 */
function updateDashboards(items) {
  const toUpdate = items || selectedDashboards.value;
  if (toUpdate.length <= 0) {
    return;
  }

  openConfirm({
    title: t('dashboards.actions.update.title', toUpdate.length),
    text: t('dashboards.actions.update.text', toUpdate.length),
    agreeText: t('dashboards.actions.update.confirm'),
    agreeIcon: '$mdi-sync',
    onAgree: async () => {
      const results = await Promise.all(
        toUpdate.map(
          (item) => $fetch(`/api/dashboard-templates/${item.id}/_refresh`, { method: 'POST' })
            .catch((err) => {
              snacks.error(t('cannotUpdateItem', { id: item.id }), err);
              return null;
            }),
        ),
      );

      if (!results.some((r) => !r)) {
        snacks.success(t('itemsUpdated', toUpdate.length));
      }

      if (!items) {
        selectedDashboards.value = [];
      }

      await refresh();
    },
  });
}

/**
 * Delete multiple dashboards
 *
 * @param {Object[]} [items] List of items to delete, if none it'll fall back to selected
 */
function deleteDashboards(items) {
  const toDelete = items || selectedDashboards.value;
  if (toDelete.length <= 0) {
    return;
  }

  openConfirm({
    title: t('dashboards.actions.delete.title', toDelete.length),
    text: t('dashboards.actions.delete.text', toDelete.length),
    agreeText: t('dashboards.actions.delete.confirm'),
    agreeIcon: '$mdi-delete',
    onAgree: async () => {
      const results = await Promise.all(
        toDelete.map(
          (item) => $fetch(`/api/dashboard-templates/${item.id}`, { method: 'DELETE' })
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
        selectedDashboards.value = [];
      }

      await refresh();
    },
  });
}

async function setCollection(collection, dashboardId) {
  try {
    await $fetch(`/api/dashboard-templates/${dashboardId}`, {
      method: 'PATCH',
      body: { collectionId: collection?.id ?? null },
    });
    refresh();
  } catch (err) {
    snacks.error(getErrorMessage(err, t('anErrorOccurred')));
  }
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
