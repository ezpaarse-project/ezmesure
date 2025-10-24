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
        <SpaceApiFilters v-bind="props" />
      </template>
    </SkeletonPageBar>

    <v-data-table-server
      v-model="selectedSpaces"
      :headers="headers"
      show-select
      return-object
      v-bind="vDataTableOptions"
    >
      <template #[`item.type`]="{ value }">
        <v-chip
          :text="$te(`spaces.types.${value}`) ? $t(`spaces.types.${value}`) : value"
          :color="repoColors.get(value)"
          size="small"
        />
      </template>

      <template #[`item.institution.name`]="{ value, item }">
        <nuxt-link :to="`/admin/institutions/${item.institutionId}`">
          {{ value }}
        </nuxt-link>
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
              v-if="spaceFormDialogRef"
              :title="$t('modify')"
              prepend-icon="mdi-pencil"
              @click="spaceFormDialogRef.open(item, { institution: item.institution })"
            />
            <v-list-item
              :title="$t('delete')"
              prepend-icon="mdi-delete"
              @click="deleteSpaces([item])"
            />

            <v-divider />

            <v-list-item
              :title="$t('open')"
              :href="`/kibana/s/${item.id}`"
              prepend-icon="mdi-open-in-app"
            />

            <v-list-item
              v-if="clipboard"
              :title="$t('copyId')"
              prepend-icon="mdi-identifier"
              @click="copySpaceId(item)"
            />
          </v-list>
        </v-menu>
      </template>
    </v-data-table-server>

    <SelectionMenu
      v-model="selectedSpaces"
      :text="$t('spaces.manageSpaces', selectedSpaces.length)"
    >
      <template #actions>
        <v-list-item
          :title="$t('delete')"
          prepend-icon="mdi-delete"
          @click="deleteSpaces()"
        />
      </template>
    </SelectionMenu>

    <SpaceFormDialog
      ref="spaceFormDialogRef"
      @submit="refresh()"
    />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['sidebase-auth', 'terms', 'admin'],
});

const { t } = useI18n();
const { isSupported: clipboard, copy } = useClipboard();
const { openConfirm } = useDialogStore();
const snacks = useSnacksStore();

const selectedSpaces = ref([]);

const spaceFormDialogRef = useTemplateRef('spaceFormDialogRef');

const {
  refresh,
  itemLength,
  query,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: '/api/kibana-spaces',
    query: {
      include: ['institution'],
    },
  },
  sortMapping: {
    institutions: 'institutions._count',
  },
  data: {
    sortBy: [
      { key: 'name', order: 'asc' },
      { key: 'institution.name', order: 'asc' },
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
    title: t('spaces.id'),
    value: 'id',
    sortable: true,
  },
  {
    title: t('spaces.type'),
    value: 'type',
    align: 'center',
    sortable: true,
  },
  {
    title: t('institutions.title'),
    value: 'institution.name',
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
  return t('spaces.toolbarTitle', { count: count ?? '?' });
});

/**
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(refresh, 250);

/**
 * Delete multiple spaces
 *
 * @param {Object[]} [items] List of items to delete, if none it'll fall back to selected
 */
function deleteSpaces(items) {
  const toDelete = items || selectedSpaces.value;
  if (toDelete.length <= 0) {
    return;
  }

  openConfirm({
    title: t('areYouSure'),
    text: t(
      'spaces.deleteNbSpaces',
      toDelete.length,
    ),
    agreeText: t('delete'),
    agreeIcon: 'mdi-delete',
    onAgree: async () => {
      const results = await Promise.all(
        toDelete.map(
          (item) => $fetch(`/api/kibana-spaces/${item.id}`, { method: 'DELETE' })
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
        selectedSpaces.value = [];
      }

      await refresh();
    },
  });
}

/**
 * Put space ID into clipboard
 *
 * @param {object} param0 Space
 */
async function copySpaceId({ id }) {
  if (!id) {
    return;
  }

  try {
    await copy(id);
  } catch (err) {
    snacks.error(t('clipboard.unableToCopy'), err);
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}
</script>
