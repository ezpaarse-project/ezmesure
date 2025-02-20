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
        v-if="roleFormDialogRef"
        v-tooltip="$t('add')"
        icon="mdi-plus"
        variant="tonal"
        density="comfortable"
        color="green"
        class="mr-2"
        @click="roleFormDialogRef.open()"
      />
    </SkeletonPageBar>

    <v-data-table-server
      v-model="selectedRoles"
      :headers="headers"
      show-select
      return-object
      v-bind="vDataTableOptions"
    >
      <template #[`item.users`]="{ item, value }">
        <v-chip
          :text="`${value.length}`"
          :variant="!value.length ? 'outlined' : undefined"
          :disabled="!usersDialogRef"
          prepend-icon="mdi-account-multiple"
          size="small"
          @click="usersDialogRef?.open(item)"
        />
      </template>

      <template #[`item.institutions`]="{ item, value }">
        <v-chip
          :text="`${value.length}`"
          :variant="!value.length ? 'outlined' : undefined"
          :disabled="!institutionsDialogRef"
          prepend-icon="mdi-domain"
          size="small"
          @click="institutionsDialogRef?.open(item)"
        />
      </template>

      <template #[`item.repositoryPermissions`]="{ value, item }">
        <v-chip
          :text="`${value.length}`"
          :variant="!value.length ? 'outlined' : undefined"
          :disabled="!permissionsDialogRef"
          prepend-icon="mdi-database-outline"
          size="small"
          @click="permissionsDialogRef?.open(item)"
        />
      </template>

      <template #[`item.repositoryAliasPermissions`]="{ value, item }">
        <v-chip
          :text="`${value.length}`"
          :variant="!value.length ? 'outlined' : undefined"
          :disabled="!permissionsDialogRef"
          prepend-icon="mdi-database-eye-outline"
          size="small"
          @click="permissionsDialogRef?.open(item)"
        />
      </template>

      <template #[`item.spacePermissions`]="{ value, item }">
        <v-chip
          :text="`${value.length}`"
          :variant="!value.length ? 'outlined' : undefined"
          :disabled="!permissionsDialogRef"
          prepend-icon="mdi-tab"
          size="small"
          @click="permissionsDialogRef?.open(item)"
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
              @click="deleteRoles([item])"
            />

            <v-divider />

            <v-list-item
              v-if="clipboard"
              :title="$t('copyId')"
              prepend-icon="mdi-identifier"
              @click="copyRoleName(item)"
            />
          </v-list>
        </v-menu>
      </template>
    </v-data-table-server>

    <SelectionMenu
      v-model="selectedRoles"
      :text="$t('elasticRoles.manageElasticRoles', selectedRoles.length)"
    >
      <template #actions>
        <v-list-item
          :title="$t('delete')"
          prepend-icon="mdi-delete"
          @click="deleteRoles()"
        />
      </template>
    </SelectionMenu>

    <ElasticRoleInstitutionsDialog
      ref="institutionsDialogRef"
      @update:model-value="refresh()"
    />
    <ElasticRoleUsersDialog
      ref="usersDialogRef"
      @update:model-value="refresh()"
    />
    <ElasticRolePermissionsDialog
      ref="permissionsDialogRef"
      @update:model-value="refresh()"
    />

    <ElasticRoleFormDialog
      ref="roleFormDialogRef"
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

const selectedRoles = ref([]);

const institutionsDialogRef = useTemplateRef('institutionsDialogRef');
const usersDialogRef = useTemplateRef('usersDialogRef');
const permissionsDialogRef = useTemplateRef('permissionsDialogRef');
const roleFormDialogRef = useTemplateRef('roleFormDialogRef');

const {
  refresh,
  itemLength,
  query,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: '/api/elastic-roles',
  },
  sortMapping: {
    institutions: 'institutions._count',
    users: 'institutions._count',
  },
  data: {
    sortBy: [{ key: 'name', order: 'asc' }],
    include: ['institutions', 'users', 'repositoryPermissions.repository', 'repositoryAliasPermissions.alias.repository', 'spacePermissions.space'],
  },
});

/**
 * Table headers
 */
const headers = computed(() => [
  {
    title: t('name'),
    value: 'name',
  },
  {
    title: t('menu.users'),
    value: 'users',
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
    title: t('institutions.members.accessRights'),
    value: 'accessRights',
    align: 'center',
    children: [
      {
        title: t('repositories.repositories'),
        value: 'repositoryPermissions',
        sortable: true,
        align: 'center',
      },
      {
        title: t('repositoryAliases.aliases'),
        value: 'repositoryAliasPermissions',
        sortable: true,
        align: 'center',
      },
      {
        title: t('spaces.spaces'),
        value: 'spacePermissions',
        sortable: true,
        align: 'center',
      },
    ],
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
  return t('elasticRoles.toolbarTitle', { count: count ?? '?' });
});

/**
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(refresh, 250);

/**
 * Delete multiple roles
 *
 * @param {Object[]} [items] List of items to delete, if none it'll fall back to selected
 */
function deleteRoles(items) {
  const toDelete = items || selectedRoles.value;
  if (toDelete.length <= 0) {
    return;
  }

  openConfirm({
    text: t(
      'elasticRoles.deleteNbRoles',
      toDelete.length,
    ),
    agreeText: t('delete'),
    agreeIcon: 'mdi-delete',
    onAgree: async () => {
      const results = await Promise.all(
        toDelete.map((item) => {
          try {
            return $fetch(`/api/elastic-roles/${item.name}`, { method: 'DELETE' });
          } catch {
            snacks.error(t('cannotDeleteItem', { id: item.name }));
            return Promise.resolve(null);
          }
        }),
      );

      if (!results.some((r) => !r)) {
        snacks.success(t('itemsDeleted', { count: toDelete.length }));
      }

      if (!items) {
        selectedRoles.value = [];
      }

      await refresh();
    },
  });
}

/**
 * Put role ID into clipboard
 *
 * @param {object} param0 Repository
 */
async function copyRoleName({ name }) {
  if (!name) {
    return;
  }

  try {
    await copy(name);
  } catch {
    snacks.error(t('clipboard.unableToCopy'));
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}
</script>
