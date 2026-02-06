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

      <template #[`item.filters`]="{ value, item }">
        <v-chip
          :text="`${value?.length ?? 0}`"
          :variant="!value?.length ? 'outlined' : undefined"
          :disabled="!aliasFormDialogRef"
          prepend-icon="mdi-filter"
          size="small"
          @click="openFiltersDialog(item)"
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
              v-if="filtersFormDialogRef"
              :title="$t('repositoryAliases.filtersForm.editFilter')"
              prepend-icon="mdi-filter"
              @click="openFiltersDialog(item)"
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

    <FiltersFormDialog
      ref="filtersFormDialogRef"
      :title="$t('repositoryAliases.filtersForm.title')"
      @submit="onAliasUpdate($event)"
    >
      <template v-if="updatedAlias" #subtitle>
        <span class="mr-2">
          {{ updatedAlias.pattern }}
        </span>

        <RepositoryTypeChip :model-value="updatedAlias.repository" />
      </template>
    </FiltersFormDialog>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['sidebase-auth', 'terms', 'admin'],
});

const { t } = useI18n();
const { isSupported: clipboard, copy } = useClipboard();
const { openConfirm } = useConfirmStore();
const snacks = useSnacksStore();

const selectedAliases = ref([]);
/** @type {Ref<object|undefined>} */
const updatedAlias = ref();

const aliasFormDialogRef = useTemplateRef('aliasFormDialogRef');
const aliasInstitutionsDialogRef = useTemplateRef('aliasInstitutionsDialogRef');
const filtersFormDialogRef = useTemplateRef('filtersFormDialogRef');

const {
  refresh,
  itemLength,
  query,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: '/api/repository-aliases',
    query: {
      include: ['institutions', 'repository'],
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
    title: t('repositoryAliases.target'),
    value: 'target',
    sortable: true,
  },
  {
    title: t('repoAliasTemplates.filters'),
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
    title: t('repositoryAliases.template'),
    value: 'templateId',
    align: 'center',
    sortable: true,
    nowrap: true,
    width: 50,
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

function openFiltersDialog(alias) {
  updatedAlias.value = alias;
  filtersFormDialogRef.value?.open(alias.filters);
}

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
        toDelete.map(
          (item) => $fetch(`/api/repository-aliases/${item.pattern}`, { method: 'DELETE' })
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
  } catch (err) {
    snacks.error(t('clipboard.unableToCopy'), err);
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}

async function onAliasUpdate(filters) {
  try {
    await $fetch(`/api/repository-aliases/${updatedAlias.value.pattern}`, {
      method: 'PUT',
      body: {
        target: updatedAlias.value.target,
        filters,
      },
    });

    refresh();
  } catch (err) {
    snacks.error(t('anErrorOccurred'), err);
  }
}
</script>
