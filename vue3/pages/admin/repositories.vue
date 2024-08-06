<template>
  <div>
    <SkeletonPageBar
      v-model:search="query.search"
      :title="toolbarTitle"
      show-search
      @update:search="debouncedRefresh()"
    >
      <v-btn
        v-if="repositoryFormRef"
        v-tooltip="$t('add')"
        icon="mdi-plus"
        variant="tonal"
        density="comfortable"
        color="green"
        class="mr-2"
        @click="repositoryFormRef.open()"
      />
      <v-btn
        v-tooltip="$t('refresh')"
        :loading="status === 'pending'"
        icon="mdi-reload"
        variant="tonal"
        density="comfortable"
        color="primary"
        class="mr-2"
        @click="refresh()"
      />
      <v-btn
        v-tooltip="$t('filter')"
        icon="mdi-filter"
        variant="tonal"
        density="comfortable"
        color="primary"
        class="mr-2"
        @click="() => {}"
      />
    </SkeletonPageBar>

    <v-data-table-server
      v-model="selectedRepositories"
      :headers="headers"
      show-select
      return-object
      v-bind="vDataTableOptions"
      @update:options="refresh()"
    >
      <template #[`item.type`]="{ value }">
        <v-chip
          :text="value"
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
      :text="$t('repositories.manageRepositories', selectedRepositories.length)"
      :selected="selectedRepositories"
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
      ref="repositoryFormRef"
      @update:model-value="refresh()"
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
  middleware: ['auth', 'terms', 'admin'],
});

const { t } = useI18n();
const { isSupported: clipboard, copy } = useClipboard();
const { openConfirm } = useDialogStore();
const snacks = useSnacksStore();

const selectedRepositories = ref([]);

/** @type {Ref<object | null>} Vue ref of the repository form */
const repositoryFormRef = ref(null);
/** @type {Ref<object | null>} Vue ref of the institution list */
const repoInstitutionsDialogRef = ref(null);

const {
  status,
  refresh,
  itemLength,
  query,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: '/api/repositories',
  },
  sortMapping: {
    institutions: 'institutions._count',
  },
  data: {
    sortBy: [{ key: 'pattern', order: 'asc' }],
    include: ['institutions'],
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
    title: t('areYouSure'),
    text: t(
      'repositories.deleteNbRepositories',
      toDelete.length,
    ),
    agreeText: t('delete'),
    agreeIcon: 'mdi-delete',
    onAgree: async () => {
      const results = await Promise.all(
        toDelete.map((item) => {
          try {
            return $fetch(`/api/repositories/${item.pattern}`, { method: 'DELETE' });
          } catch (e) {
            snacks.error(t('cannotDeleteItem', { id: item.pattern }));
            return Promise.resolve(null);
          }
        }),
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
  if (!id) {
    return;
  }

  try {
    await copy(pattern);
  } catch (e) {
    snacks.error(t('clipboard.copyFailed'));
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}
</script>
