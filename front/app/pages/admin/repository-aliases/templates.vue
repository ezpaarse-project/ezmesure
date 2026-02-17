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
        <RepositoryAliasTemplateApiFilters v-bind="props" />
      </template>

      <v-btn
        v-if="templateFormDialogRef"
        v-tooltip="$t('add')"
        icon="mdi-plus"
        variant="tonal"
        density="comfortable"
        color="green"
        class="mr-2"
        @click="templateFormDialogRef.open()"
      />
    </SkeletonPageBar>

    <v-data-table-server
      v-model="selectedTemplates"
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
          :text="`${value.length}`"
          :variant="!value.length ? 'outlined' : undefined"
          :disabled="!templateFormDialogRef"
          prepend-icon="mdi-filter"
          size="small"
          @click="templateFormDialogRef?.open(item.id)"
        />
      </template>

      <template #[`item.conditions`]="{ value, item }">
        <v-chip
          :text="`${value.length}`"
          :variant="!value.length ? 'outlined' : undefined"
          :disabled="!templateFormDialogRef"
          prepend-icon="mdi-format-list-checks"
          size="small"
          @click="templateFormDialogRef?.open(item.id)"
        />
      </template>

      <template #[`item._count.aliases`]="{ value, item }">
        <v-chip
          :text="`${value}`"
          :variant="!value ? 'outlined' : undefined"
          prepend-icon="mdi-database-eye"
          size="small"
          @click="templateFormDialogRef?.open(item.id)"
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
              v-if="templateFormDialogRef"
              :title="$t('apply')"
              prepend-icon="mdi-play-circle-outline"
              @click="templateApplyDialogRef.open(item.id)"
            />

            <v-list-item
              v-if="templateFormDialogRef"
              :title="$t('modify')"
              prepend-icon="mdi-pencil"
              @click="templateFormDialogRef.open(item.id)"
            />

            <v-list-item
              :title="$t('delete')"
              prepend-icon="mdi-delete"
              @click="deleteItems([item])"
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

      <template #[`item.active`]="{ item }">
        <v-switch
          :model-value="item.active"
          :loading="activeLoading.has(item.id)"
          density="compact"
          color="primary"
          hide-details
          style="transform: scale(0.8);"
          @update:model-value="toggleActiveStates([item])"
        />
      </template>
    </v-data-table-server>

    <SelectionMenu
      v-model="selectedTemplates"
      :text="$t('repoAliasTemplates.manageTemplates', selectedTemplates.length)"
    >
      <template #actions>
        <v-list-item
          :title="$t('delete')"
          prepend-icon="mdi-delete"
          @click="deleteItems()"
        />

        <v-divider />

        <v-list-item
          :title="$t('activeSwitch')"
          prepend-icon="mdi-toggle-switch"
          @click="toggleActiveStates()"
        />
      </template>
    </SelectionMenu>

    <RepositoryAliasTemplateFormDialog
      ref="templateFormDialogRef"
      @submit="refresh()"
    />

    <RepositoryAliasTemplateApplyDialog
      ref="templateApplyDialogRef"
      @close="refresh()"
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
const { openConfirm } = useConfirmStore();
const snacks = useSnacksStore();

const activeLoading = ref(new Set());
const selectedTemplates = ref([]);
const templateFormDialogRef = useTemplateRef('templateFormDialogRef');
const templateApplyDialogRef = useTemplateRef('templateApplyDialogRef');

const {
  refresh,
  itemLength,
  query,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: '/api/repository-alias-templates',
    query: {
      include: ['repository', '_count.aliases'],
    },
  },
  sortMapping: {
    '_count.aliases': 'aliases._count',
  },
  data: {
    sortBy: [{ key: 'id', order: 'asc' }],
  },
});

/**
 * Table headers
 */
const headers = computed(() => [
  {
    title: t('identifier'),
    value: 'id',
    sortable: true,
    nowrap: true,
  },
  {
    title: t('repoAliasTemplates.aliasesPattern'),
    value: 'pattern',
    sortable: true,
    nowrap: true,
  },
  {
    title: t('repoAliasTemplates.target'),
    value: 'target',
    sortable: true,
    nowrap: true,
  },
  {
    title: t('repoAliasTemplates.conditions'),
    value: 'conditions',
    align: 'center',
  },
  {
    title: t('repoAliasTemplates.filters'),
    value: 'filters',
    align: 'center',
  },
  {
    title: t('repoAliasTemplates.aliases'),
    value: '_count.aliases',
    align: 'center',
    sortable: true,
    width: 10,
    nowrap: true,
  },
  {
    title: t('type'),
    value: 'repository.type',
    align: 'start',
    sortable: true,
    width: 50,
  },
  {
    title: t('active'),
    value: 'active',
    align: 'start',
    sortable: true,
    width: 120,
  },
  {
    title: t('actions'),
    value: 'actions',
    align: 'end',
    width: 0,
    nowrap: true,
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
  return t('repoAliasTemplates.toolbarTitle', { count: count ?? '?' });
});

/**
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(refresh, 250);

/**
 * Delete multiple alias templates
 *
 * @param {Object[]} [items] List of items to delete, if none it'll fall back to selected
 */
function deleteItems(items) {
  const toDelete = items || selectedTemplates.value;
  if (toDelete.length <= 0) {
    return;
  }

  openConfirm({
    text: t(
      'repoAliasTemplates.deleteNbTemplates',
      toDelete.length,
    ),
    agreeText: t('delete'),
    agreeIcon: 'mdi-delete',
    onAgree: async () => {
      const results = await Promise.all(
        toDelete.map(
          (item) => $fetch(`/api/repository-alias-templates/${item.id}`, { method: 'DELETE' })
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
        selectedTemplates.value = [];
      }

      await refresh();
    },
  });
}

/**
 * Toggle active states for selected templates
 *
 * @param {Object[]} [items] The templates to toggle, defaults to selected
 */
async function toggleActiveStates(items) {
  const itemsToToggle = items || selectedTemplates.value;

  if (itemsToToggle.length <= 0) {
    return;
  }

  await Promise.all(
    itemsToToggle.map(async (itemToToggle) => {
      activeLoading.value.add(itemToToggle.id);
      const item = itemToToggle;
      const active = !item.active;

      try {
        await $fetch(`/api/repository-alias-templates/${item.id}/active`, {
          method: 'PUT',
          body: { value: active },
        });
        item.active = active;
      } catch (err) {
        snacks.error(t('anErrorOccurred'), err);
      }

      activeLoading.value.delete(item.id);
    }),
  );

  if (!items) {
    selectedTemplates.value = [];
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
