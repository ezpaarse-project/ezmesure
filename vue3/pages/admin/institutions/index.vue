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
        v-if="institutionFormDialogRef"
        v-tooltip="$t('add')"
        icon="mdi-plus"
        variant="tonal"
        density="comfortable"
        color="green"
        class="mr-2"
        @click="showForm()"
      />
    </SkeletonPageBar>

    <v-data-table-server
      v-model="selectedInstitutions"
      :headers="headers"
      show-select
      return-object
      v-bind="vDataTableOptions"
    >
      <template #[`item.name`]="{ item }">
        <nuxt-link :to="`/admin/institutions/${item.id}`">
          {{ item.name }}
        </nuxt-link>
      </template>

      <template #[`item.memberships`]="{ item, value }">
        <v-chip
          :text="`${value.length}`"
          :to="`/admin/institutions/${item.id}/members`"
          :variant="!value.length ? 'outlined' : undefined"
          prepend-icon="mdi-account-multiple"
          size="small"
        />
      </template>

      <template #[`item.childInstitutions`]="{ value, item }">
        <v-chip
          :text="`${value.length}`"
          :variant="!value.length ? 'outlined' : undefined"
          :disabled="!institutionComponentsDialogRef"
          prepend-icon="mdi-family-tree"
          size="small"
          @click="institutionComponentsDialogRef?.open(item)"
        />
      </template>

      <template #[`item.repositories`]="{ value, item }">
        <v-chip
          :text="`${value.length}`"
          :variant="!value.length ? 'outlined' : undefined"
          :disabled="!institutionRepositoriesDialogRef"
          prepend-icon="mdi-database-outline"
          size="small"
          @click="institutionRepositoriesDialogRef?.open(item)"
        />
      </template>

      <template #[`item.spaces`]="{ value, item }">
        <v-chip
          :text="`${value.length}`"
          :variant="!value.length ? 'outlined' : undefined"
          :disabled="!institutionSpacesDialogRef"
          prepend-icon="mdi-tab"
          size="small"
          @click="institutionSpacesDialogRef?.open(item)"
        />
      </template>

      <template #[`item.sushiCredentials`]="{ value, item }">
        <v-chip
          :text="`${value.length}`"
          :variant="!value.length ? 'outlined' : undefined"
          :to="`/admin/institutions/${item.id}/sushi`"
          prepend-icon="mdi-key"
          size="small"
        />
      </template>

      <template #[`item.validated`]="{ value, item }">
        <ConfirmPopover
          :title="$t('areYouSure')"
          :text="$t('institutions.validateNbInstitutions', 1)"
          :agree-text="$t('confirm')"
          :agree="() => toggleInstitutions([item])"
          location="bottom start"
        >
          <template #activator="{ props }">
            <v-switch
              :model-value="value"
              :label="value
                ? $t('institutions.institution.validated')
                : $t('institutions.institution.notValidated')"
              density="comfortable"
              color="primary"
              hide-details
              readonly
              style="transform: scale(0.8);"
              v-bind="props"
            />
          </template>
        </ConfirmPopover>
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
              v-if="institutionFormDialogRef"
              :title="$t('modify')"
              prepend-icon="mdi-pencil"
              @click="showForm(item)"
            />
            <v-list-item
              :title="$t('delete')"
              prepend-icon="mdi-delete"
              @click="deleteInstitutions([item])"
            />

            <v-divider />

            <v-list-item
              :title="$t('institutions.sushi.credentials')"
              :to="`/admin/institutions/${item.id}/sushi`"
              prepend-icon="mdi-key"
            />
            <v-list-item
              :title="$t('institutions.members.members')"
              :to="`/admin/institutions/${item.id}/members`"
              prepend-icon="mdi-account-multiple"
            />
            <v-list-item
              :title="$t('institutions.reports.reports')"
              :to="`/admin/institutions/${item.id}/reports`"
              prepend-icon="mdi-file-chart-outline"
            />
            <v-list-item
              v-if="clipboard"
              :title="$t('copyId')"
              prepend-icon="mdi-identifier"
              @click="copyInstitutionId(item)"
            />
          </v-list>
        </v-menu>
      </template>
    </v-data-table-server>

    <SelectionMenu
      v-model="selectedInstitutions"
      :text="$t('institutions.manageN', selectedInstitutions.length)"
    >
      <template #actions>
        <v-list-item
          :title="$t('delete')"
          prepend-icon="mdi-delete"
          @click="deleteInstitutions()"
        />

        <v-divider />

        <v-list-item
          :title="$t('institutions.validateSwitch')"
          prepend-icon="mdi-check"
          @click="toggleInstitutions()"
        />
      </template>
    </SelectionMenu>

    <InstitutionFormDialog
      ref="institutionFormDialogRef"
      @update:model-value="refresh()"
    />

    <InstitutionComponentsDialog
      ref="institutionComponentsDialogRef"
      @update:model-value="refresh()"
    />

    <InstitutionRepositoriesDialog
      ref="institutionRepositoriesDialogRef"
      @update:model-value="refresh()"
    />

    <InstitutionSpacesDialog
      ref="institutionSpacesDialogRef"
      @update:model-value="refresh()"
    />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'terms', 'admin'],
  alias: ['/admin/'],
});

const { t } = useI18n();
const { isSupported: clipboard, copy } = useClipboard();
const { openConfirm } = useDialogStore();
const snacks = useSnacksStore();

const selectedInstitutions = ref([]);

const institutionFormDialogRef = useTemplateRef('institutionFormDialogRef');
const institutionComponentsDialogRef = useTemplateRef('institutionComponentsDialogRef');
const institutionRepositoriesDialogRef = useTemplateRef('institutionRepositoriesDialogRef');
const institutionSpacesDialogRef = useTemplateRef('institutionSpacesDialogRef');

const {
  refresh, // Refresh the data
  itemLength, // Total number of items
  query, // Query parameters
  vDataTableOptions, // Options to pass to v-data-table
} = await useServerSidePagination({
  // Fetch options to pass to $fetch
  fetch: {
    url: '/api/institutions',
  },
  // Mapping between the field in DataTable and the field in the API
  // used when sorting
  sortMapping: {
    memberships: 'memberships._count',
    childInstitutions: 'childInstitutions._count',
    repositories: 'repositories._count',
    spaces: 'spaces._count',
    sushiCredentials: 'sushiCredentials._count',
  },
  // Initial data for the query, use only static here. If you want
  // reactivity please use `query.something = myReactiveThingy.value`
  data: {
    sortBy: [{ key: 'name', order: 'asc' }],
    include: ['repositories', 'spaces', 'memberships', 'childInstitutions', 'sushiCredentials'],
  },
});

/**
 * Table headers
 */
const headers = computed(() => [
  {
    title: t('institutions.title'),
    value: 'name',
    sortable: true,
  },
  {
    title: t('institutions.institution.acronym'),
    value: 'acronym',
    sortable: true,
  },
  {
    title: t('institutions.institution.members'),
    value: 'memberships',
    align: 'center',
    sortable: true,
  },
  {
    title: t('components.components'),
    value: 'childInstitutions',
    align: 'center',
    sortable: true,
  },
  {
    title: t('repositories.repositories'),
    value: 'repositories',
    align: 'center',
    sortable: true,
  },
  {
    title: t('spaces.spaces'),
    value: 'spaces',
    align: 'center',
    sortable: true,
  },
  {
    title: t('sushi.credentials'),
    value: 'sushiCredentials',
    align: 'center',
    sortable: true,
  },
  {
    title: t('institutions.institution.status'),
    value: 'validated',
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
  return t('institutions.toolbarTitle', { count: count ?? '?' });
});

/**
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(refresh, 250);

/**
 * Show creation/update form
 *
 * @param {Object} [item] The institution to edit
 */
async function showForm(item) {
  if (item) {
    institutionFormDialogRef.value?.open(item);
    return;
  }

  institutionFormDialogRef.value?.open(undefined, { addAsMember: false });
}

/**
 * Delete multiple institutions
 *
 * @param {Object[]} [items] List of items to delete, if none it'll fall back to selected
 */
function deleteInstitutions(items) {
  const toDelete = items || selectedInstitutions.value;
  if (toDelete.length <= 0) {
    return;
  }

  openConfirm({
    title: t('areYouSure'),
    text: t(
      'institutions.deleteNbInstitutions.text',
      toDelete.length,
      { named: { affected: t('institutions.deleteNbInstitutions.affected') } },
    ),
    agreeText: t('delete'),
    agreeIcon: 'mdi-delete',
    onAgree: async () => {
      const results = await Promise.all(
        toDelete.map((item) => {
          try {
            return $fetch(`/api/institutions/${item.id}`, { method: 'DELETE' });
          } catch {
            snacks.error(t('cannotDeleteItem', { id: item.name || item.id }));
            return Promise.resolve(null);
          }
        }),
      );

      if (!results.some((r) => !r)) {
        snacks.success(t('itemsDeleted', { count: toDelete.length }));
      }

      if (!items) {
        selectedInstitutions.value = [];
      }

      await refresh();
    },
  });
}

function toggleInstitutions(items) {
  const toActivate = items || selectedInstitutions.value;
  if (toActivate.length <= 0) {
    return;
  }

  openConfirm({
    title: t('areYouSure'),
    text: t(
      'institutions.validateNbInstitutions',
      toActivate.length,
    ),
    onAgree: async () => {
      const results = await Promise.all(
        toActivate.map((item) => {
          try {
            const value = !item.validated;
            return $fetch(`/api/institutions/${item.id}/validated`, {
              method: 'PUT',
              body: { value },
            });
          } catch {
            snacks.error(t('cannotUpdateItem', { id: item.name || item.id }));
            return Promise.resolve(null);
          }
        }),
      );

      if (!results.some((r) => !r)) {
        snacks.success(t('itemsUpdated', { count: toActivate.length }));
      }

      if (!items) {
        selectedInstitutions.value = [];
      }

      await refresh();
    },
  });
}

/**
 * Put institution ID into clipboard
 *
 * @param {object} param0 Institution
 */
async function copyInstitutionId({ id }) {
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
