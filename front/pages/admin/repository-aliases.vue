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
        <RepositoryAliasApiFilters v-bind="props" />
      </template>

      <v-btn
        v-if="aliasFormDialogRef"
        v-tooltip="$t('add')"
        icon="mdi-plus"
        variant="tonal"
        density="comfortable"
        color="green"
        class="mr-2"
        @click="aliasFormDialogRef.open()"
      />
    </SkeletonPageBar>

    <v-data-table-server
      v-model="selectedAliases"
      :headers="headers"
      show-select
      return-object
      v-bind="vDataTableOptions"
    >
      <template #[`item.repository.type`]="{ value }">
        <v-chip
          :text="$te(`spaces.types.${value}`) ? $t(`spaces.types.${value}`) : value"
          :color="repoColors.get(value)"
          size="small"
        />
      </template>

      <template #[`item.filters`]="{ value }">
        <v-icon
          v-if="!!value"
          icon="mdi-filter"
          size="small"
        />
      </template>

      <template #[`item.institutions`]="{ value, item }">
        <v-chip
          :text="`${value.length}`"
          :variant="!value.length ? 'outlined' : undefined"
          prepend-icon="mdi-domain"
          size="small"
          @click="aliasInstitutionsDialogRef?.open(item)"
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
              v-if="filterFormDialogRef"
              :title="$t('repositoryAliases.filtersForm.editFilter')"
              prepend-icon="mdi-filter"
              @click="filterFormDialogRef.open(item, { repository: item.repository })"
            />

            <v-list-item
              :title="$t('delete')"
              prepend-icon="mdi-delete"
              @click="deleteAliases([item])"
            />

            <v-divider />

            <v-list-item
              v-if="clipboard"
              :title="$t('copyId')"
              prepend-icon="mdi-identifier"
              @click="copyAliasPattern(item)"
            />
          </v-list>
        </v-menu>
      </template>
    </v-data-table-server>

    <SelectionMenu
      v-model="selectedAliases"
      :text="$t('repositoryAliases.manageRepositoryAliases', selectedAliases.length)"
    >
      <template #actions>
        <v-list-item
          :title="$t('delete')"
          prepend-icon="mdi-delete"
          @click="deleteAliases()"
        />
      </template>
    </SelectionMenu>

    <RepositoryAliasFormDialog
      ref="aliasFormDialogRef"
      @submit="refresh()"
    />

    <RepositoryAliasInstitutionsDialog
      ref="aliasInstitutionsDialogRef"
      @update:model-value="refresh()"
    />

    <RepositoryAliasFilterFormDialog
      ref="filterFormDialogRef"
      @submit="onAliasUpdate($event)"
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

const selectedAliases = ref([]);

const aliasFormDialogRef = useTemplateRef('aliasFormDialogRef');
const aliasInstitutionsDialogRef = useTemplateRef('aliasInstitutionsDialogRef');
const filterFormDialogRef = useTemplateRef('filterFormDialogRef');

const {
  refresh,
  itemLength,
  query,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: '/api/repository-aliases',
  },
  sortMapping: {
    institutions: 'institutions._count',
  },
  data: {
    sortBy: [{ key: 'pattern', order: 'asc' }],
    include: ['institutions', 'repository'],
  },
});

/**
 * Table headers
 */
const headers = computed(() => [
  {
    title: t('repositories.pattern'),
    value: 'pattern',
    sortable: true,
  },
  {
    title: t('repositoryAliases.target'),
    value: 'target',
    sortable: true,
  },
  {
    title: t('repositoryAliases.filtered'),
    value: 'filters',
    align: 'center',
  },
  {
    title: t('repositories.type'),
    value: 'repository.type',
    align: 'center',
    sortable: true,
  },
  {
    title: t('repositories.institutions'),
    value: 'institutions',
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
  return t('repositoryAliases.toolbarTitle', { count: count ?? '?' });
});

/**
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(refresh, 250);

/**
 * Delete multiple repositoryAliases
 *
 * @param {Object[]} [items] List of items to delete, if none it'll fall back to selected
 */
function deleteAliases(items) {
  const toDelete = items || selectedAliases.value;
  if (toDelete.length <= 0) {
    return;
  }

  openConfirm({
    text: t(
      'repositoryAliases.deleteNbAliases',
      toDelete.length,
    ),
    agreeText: t('delete'),
    agreeIcon: 'mdi-delete',
    onAgree: async () => {
      const results = await Promise.all(
        toDelete.map((item) => {
          try {
            return $fetch(`/api/repository-aliases/${item.pattern}`, { method: 'DELETE' });
          } catch {
            snacks.error(t('cannotDeleteItem', { id: item.pattern }));
            return Promise.resolve(null);
          }
        }),
      );

      if (!results.some((r) => !r)) {
        snacks.success(t('itemsDeleted', { count: toDelete.length }));
      }

      if (!items) {
        selectedAliases.value = [];
      }

      await refresh();
    },
  });
}

/**
 * Put alias ID into clipboard
 *
 * @param {object} param0 Repository
 */
async function copyAliasPattern({ pattern }) {
  if (!id) {
    return;
  }

  try {
    await copy(pattern);
  } catch {
    snacks.error(t('clipboard.unableToCopy'));
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}

async function onAliasUpdate(alias) {
  try {
    await $fetch(`/api/repository-aliases/${alias.pattern}`, {
      method: 'PUT',
      body: {
        target: alias.target,
        filters: alias.filters,
      },
    });

    refresh();
  } catch {
    snacks.error(t('anErrorOccurred'));
  }
}
</script>
