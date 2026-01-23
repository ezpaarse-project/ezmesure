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

    <v-container fluid>
      <v-row>
        <v-col>
          <p>{{ $t('roles.pageDesc') }}</p>
        </v-col>
      </v-row>
    </v-container>

    <v-data-table-server
      v-model="selectedRoles"
      :headers="headers"
      show-select
      return-object
      v-bind="vDataTableOptions"
    >
      <template #[`item.label`]="{ item }">
        <RoleChip :role="item" />
      </template>

      <template #[`item.restricted`]="{ item }">
        <v-icon
          v-tooltip:top="$t(item.restricted ? 'roles.onlyAdmins' : 'roles.notOnlyAdmins')"
          :color="item.restricted ? '' : 'grey-lighten-2'"
          :icon="item.restricted ? 'mdi-lock' : 'mdi-lock-off'"
        />
      </template>

      <template #[`item._count.membershipRoles`]="{ value, item }">
        <v-chip
          :text="`${value}`"
          :variant="!value ? 'outlined' : undefined"
          prepend-icon="mdi-account"
          size="small"
          @click="institutionsDialogRef?.open(item)"
        />
      </template>

      <template #[`item.actions`]="{ item }">
        <v-btn
          v-tooltip:top="$t('modify')"
          :disabled="!roleFormDialogRef"
          icon="mdi-pencil"
          variant="text"
          density="comfortable"
          color="blue"
          @click="roleFormDialogRef?.open(item)"
        />
        <v-btn
          v-tooltip:top="$t('delete')"
          icon="mdi-delete"
          variant="text"
          density="comfortable"
          color="red"
          @click="deleteRole([item])"
        />
      </template>
    </v-data-table-server>

    <SelectionMenu
      v-model="selectedRoles"
      :text="$t('roles.manageRoles', selectedRoles.length)"
    >
      <template #actions>
        <v-list-item
          :title="$t('delete')"
          prepend-icon="mdi-delete"
          @click="deleteRole()"
        />
      </template>
    </SelectionMenu>

    <RoleFormDialog
      ref="roleFormDialogRef"
      @submit="refresh()"
    />

    <RoleMembershipsDialog
      ref="institutionsDialogRef"
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
const { openConfirm } = useDialogStore();
const snacks = useSnacksStore();

const selectedRoles = ref([]);

const roleFormDialogRef = useTemplateRef('roleFormDialogRef');
const institutionsDialogRef = useTemplateRef('institutionsDialogRef');

const {
  refresh,
  itemLength,
  query,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: '/api/roles',
    query: { include: '_count.membershipRoles' },
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
  },
  {
    title: t('label'),
    value: 'label',
    sortable: true,
  },
  {
    title: t('description'),
    value: 'description',
    sortable: true,
  },
  {
    title: t('roles.restricted'),
    value: 'restricted',
    align: 'center',
    sortable: false,
    width: 130,
  },
  {
    title: t('roles.assignments'),
    value: '_count.membershipRoles',
    align: 'center',
    sortable: false,
    width: 130,
  },
  {
    title: t('actions'),
    value: 'actions',
    align: 'center',
    width: 130,
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
  return t('roles.toolbarTitle', { count: count ?? '?' });
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
function deleteRole(items) {
  const toDelete = items || selectedRoles.value;
  if (toDelete.length <= 0) {
    return;
  }

  openConfirm({
    text: t(
      'roles.deleteNbRole',
      toDelete.length,
    ),
    agreeText: t('delete'),
    agreeIcon: 'mdi-delete',
    onAgree: async () => {
      const results = await Promise.all(
        toDelete.map(
          (item) => $fetch(`/api/roles/${item.id}`, { method: 'DELETE' })
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
        selectedRoles.value = [];
      }

      await refresh();
    },
  });
}

</script>
