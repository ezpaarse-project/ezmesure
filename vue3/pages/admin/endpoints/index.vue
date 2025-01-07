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
      <template #filters-panel="props">
        <SushiEndpointFilters v-bind="props" />
      </template>

      <v-btn
        v-if="endpointFormDialogRef"
        v-tooltip="$t('add')"
        icon="mdi-plus"
        variant="tonal"
        density="comfortable"
        color="green"
        class="mr-2"
        @click="endpointFormDialogRef.open()"
      />
    </SkeletonPageBar>

    <v-data-table-server
      v-model="selectedEndpoints"
      :headers="headers"
      show-select
      show-expand
      return-object
      v-bind="vDataTableOptions"
    >
      <template #[`item.tags`]="{ value }">
        <v-chip
          v-for="(tag, index) in value"
          :key="index"
          variant="outlined"
          color="primary"
          size="small"
          label
          class="ml-1"
        >
          {{ tag }}
        </v-chip>
      </template>

      <template #[`item.disabledUntil`]="{ item }">
        <SushiEndpointDisabledChip :model-value="item" />
      </template>

      <template #[`item.credentials`]="{ value, item }">
        <SushiCountChip
          :model-value="value"
          :to="`/admin/endpoints/${item.id}`"
        />
      </template>

      <template #[`item.active`]="{ item }">
        <v-switch
          v-tooltip:left="$t(`endpoints.${item.active ? 'activeSince' : 'inactiveSince'}`, { date: dateFormat(item.activeUpdatedAt, locale) })"
          :model-value="item.active"
          :label="item.active ? $t('endpoints.active') : $t('endpoints.inactive')"
          :loading="activeLoadingMap.get(item.id)"
          density="compact"
          color="primary"
          hide-details
          class="mt-0"
          style="transform: scale(0.8);"
          @update:model-value="toggleActiveStates([item])"
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
              v-if="endpointFormDialogRef"
              :title="$t('modify')"
              prepend-icon="mdi-pencil"
              @click="endpointFormDialogRef.open(item)"
            />
            <v-list-item
              v-if="endpointFormDialogRef"
              :title="$t('duplicate')"
              prepend-icon="mdi-content-copy"
              @click="endpointFormDialogRef.open({ ...item, id: null })"
            />
            <v-list-item
              :title="$t('delete')"
              prepend-icon="mdi-delete"
              @click="deleteEndpoints([item])"
            />

            <v-divider />

            <v-list-item
              v-if="clipboard"
              :title="$t('copyId')"
              prepend-icon="mdi-identifier"
              @click="copyEndpointId(item)"
            />
          </v-list>
        </v-menu>
      </template>

      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length">
            <SushiEndpointDetails :model-value="item" />
          </td>
        </tr>
      </template>
    </v-data-table-server>

    <SelectionMenu
      v-model="selectedEndpoints"
      :text="$t('endpoints.manageEndpoints', selectedEndpoints.length)"
    >
      <template #actions>
        <v-list-item
          :title="$t('delete')"
          prepend-icon="mdi-delete"
          @click="deleteEndpoints()"
        />

        <v-divider />

        <v-list-item
          :title="$t('institutions.sushi.activeSwitch')"
          prepend-icon="mdi-toggle-switch"
          @click="toggleActiveStates()"
        />
      </template>
    </SelectionMenu>

    <SushiEndpointFormDialog
      ref="endpointFormDialogRef"
      @submit="refresh()"
    />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['sidebase-auth', 'terms', 'admin'],
});

const { t, locale } = useI18n();
const { isSupported: clipboard, copy } = useClipboard();
const { openConfirm } = useDialogStore();
const snacks = useSnacksStore();

const selectedEndpoints = ref([]);
const activeLoadingMap = ref(new Map());

const endpointFormDialogRef = useTemplateRef('endpointFormDialogRef');

const {
  refresh,
  itemLength,
  query,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: '/api/sushi-endpoints',
  },
  sortMapping: {
    institutions: 'institutions._count',
    credentials: 'credentials._count',
  },
  data: {
    sortBy: [{ key: 'vendor', order: 'asc' }],
    include: ['credentials'],
  },
});

/**
 * Table headers
 */
const headers = computed(() => [
  {
    title: t('endpoints.vendor'),
    value: 'vendor',
    sortable: true,
  },
  {
    title: t('endpoints.tags'),
    value: 'tags',
    align: 'center',
    sortable: true,
  },
  {
    title: t('endpoints.disabledUntil'),
    value: 'disabledUntil',
    align: 'center',
    sortable: true,
  },
  {
    title: t('sushi.credentials'),
    value: 'credentials',
    align: 'center',
    sortable: true,
  },
  {
    title: t('status'),
    value: 'active',
    align: 'center',
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
  return t('endpoints.toolbarTitle', { count: count ?? '?' });
});

/**
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(refresh, 250);

/**
 * Toggle active states for selected endpoints
 *
 * @param {any[]} items Endpoints to toggle, defaults to selected
 */
async function toggleActiveStates(items) {
  const toToggle = items || selectedEndpoints.value;
  if (toToggle.length <= 0) {
    return;
  }

  await Promise.all(
    toToggle.map(async (item) => {
      activeLoadingMap.value.set(item.id, true);
      try {
        const active = !item.active;
        // eslint-disable-next-line no-await-in-loop
        await $fetch(`/api/sushi-endpoints/${item.id}`, {
          method: 'PATCH',
          body: { active },
        });

        // eslint-disable-next-line no-param-reassign
        item.active = active;
        activeLoadingMap.value.set(item.id, false);
        return item;
      } catch {
        snacks.error(t('endpoints.unableToUpdate'));
        activeLoadingMap.value.set(item.id, false);
        return null;
      }
    }),
  );

  if (!items) {
    selectedEndpoints.value = [];
  }
}

/**
 * Delete multiple endpoints
 *
 * @param {Object[]} [items] List of items to delete, if none it'll fall back to selected
 */
function deleteEndpoints(items) {
  const toDelete = items || selectedEndpoints.value;
  if (toDelete.length <= 0) {
    return;
  }

  openConfirm({
    title: t('areYouSure'),
    text: t(
      'endpoints.deleteNbEndpoints',
      toDelete.length,
    ),
    agreeText: t('delete'),
    agreeIcon: 'mdi-delete',
    onAgree: async () => {
      const results = await Promise.all(
        toDelete.map((item) => {
          try {
            return $fetch(`/api/sushi-endpoints/${item.id}`, { method: 'DELETE' });
          } catch {
            snacks.error(t('cannotDeleteItem', { id: item.id }));
            return Promise.resolve(null);
          }
        }),
      );

      if (!results.some((r) => !r)) {
        snacks.success(t('itemsDeleted', { count: toDelete.length }));
      }

      if (!items) {
        selectedEndpoints.value = [];
      }

      await refresh();
    },
  });
}

/**
 * Put endpoint ID into clipboard
 *
 * @param {object} param0 Endpoint
 */
async function copyEndpointId({ id }) {
  if (!id) {
    return;
  }

  try {
    await copy(id);
  } catch {
    snacks.error(t('clipboard.unableToCopy'));
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}
</script>
