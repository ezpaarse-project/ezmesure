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
        <RepositoryApiFilters v-bind="props" />
      </template>

      <v-btn
        v-if="repositoryFormDialogRef"
        v-tooltip="$t('add')"
        icon="mdi-plus"
        variant="tonal"
        density="comfortable"
        color="green"
        class="mr-2"
        @click="repositoryFormDialogRef.open()"
      />
    </SkeletonPageBar>

    <v-data-table-server
      v-model="selectedRepositories"
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

      <template #[`item.institutions`]="{ value, item }">
        <v-chip
          :text="`${value.length}`"
          :variant="!value.length ? 'outlined' : undefined"
          prepend-icon="mdi-domain"
          size="small"
          @click="repoInstitutionsDialogRef?.open(item)"
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
              v-if="repositoryUpdateFormDialogRef"
              :title="$t('modify')"
              prepend-icon="mdi-pencil"
              @click="repositoryUpdateFormDialogRef.open(item)"
            />
            <v-list-item
              :title="$t('delete')"
              prepend-icon="mdi-delete"
              @click="deleteRepositories([item])"
            />

            <v-divider />

            <v-list-item
              v-if="clipboard"
              :title="$t('copyId')"
              prepend-icon="mdi-identifier"
              @click="copyRepositoryPattern(item)"
            />
          </v-list>
        </v-menu>
      </template>
    </v-data-table-server>

    <SelectionMenu
      v-model="selectedRepositories"
      :text="$t('repositories.manageRepositories', selectedRepositories.length)"
    >
      <template #actions>
        <v-list-item
          :title="$t('delete')"
          prepend-icon="mdi-delete"
          @click="deleteRepositories()"
        />
      </template>
    </SelectionMenu>

    <RepositoryFormDialog
      ref="repositoryFormDialogRef"
      @submit="refresh()"
    />

    <RepositoryUpdateFormDialog
      ref="repositoryUpdateFormDialogRef"
      @submit="refresh()"
    />

    <RepositoryInstitutionsDialog
      ref="repoInstitutionsDialogRef"
      @update:model-value="refresh()"
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

const selectedRepositories = ref([]);

const repositoryFormDialogRef = useTemplateRef('repositoryFormDialogRef');
const repositoryUpdateFormDialogRef = useTemplateRef('repositoryUpdateFormDialogRef');
const repoInstitutionsDialogRef = useTemplateRef('repoInstitutionsDialogRef');

const {
  refresh,
  itemLength,
  query,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: '/api/repositories',
    query: {
      include: ['institutions'],
    },
  },
  sortMapping: {
    institutions: 'institutions._count',
  },
  data: {
    sortBy: [{ key: 'pattern', order: 'asc' }],
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
    title: t('repositories.type'),
    value: 'type',
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
  return t('repositories.toolbarTitle', { count: count ?? '?' });
});

/**
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(refresh, 250);

/**
 * Delete multiple repositories
 *
 * @param {Object[]} [items] List of items to delete, if none it'll fall back to selected
 */
function deleteRepositories(items) {
  const toDelete = items || selectedRepositories.value;
  if (toDelete.length <= 0) {
    return;
  }

  openConfirm({
    text: t(
      'repositories.deleteNbRepositories',
      toDelete.length,
    ),
    agreeText: t('delete'),
    agreeIcon: 'mdi-delete',
    onAgree: async () => {
      const results = await Promise.all(
        toDelete.map(
          (item) => $fetch(`/api/repositories/${item.pattern}`, { method: 'DELETE' })
            .catch((err) => {
              snacks.error(t('cannotDeleteItem', { id: item.pattern }), err);
              return null;
            }),
        ),
      );

      if (!results.some((r) => !r)) {
        snacks.success(t('itemsDeleted', { count: toDelete.length }));
      }

      if (!items) {
        selectedRepositories.value = [];
      }

      await refresh();
    },
  });
}

/**
 * Put repository ID into clipboard
 *
 * @param {object} param0 Repository
 */
async function copyRepositoryPattern({ pattern }) {
  if (!pattern) {
    return;
  }

  try {
    await copy(pattern);
  } catch (err) {
    snacks.error(t('clipboard.unableToCopy'), err);
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}
</script>
