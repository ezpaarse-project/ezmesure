<template>
  <div>
    <SkeletonPageBar
      v-model="query"
      :title="toolbarTitle"
      :refresh="refresh"
      :omit-from-filter-count="['search', 'source']"
      search
      icons
      @update:model-value="debouncedRefresh()"
    >
      <template #filters-panel="props">
        <UserApiFilters v-bind="props" />
      </template>

      <v-btn
        v-if="userFormDialogRef"
        v-tooltip="$t('add')"
        icon="mdi-plus"
        variant="tonal"
        density="comfortable"
        color="green"
        class="mr-2"
        @click="userFormDialogRef.open()"
      />
    </SkeletonPageBar>

    <v-data-table-server
      v-model="selectedUsers"
      :headers="headers"
      :row-props="({ item }) => ({ class: item.deletedAt && 'bg-grey-lighten-4 text-grey' })"
      show-select
      return-object
      v-bind="vDataTableOptions"
    >
      <template #[`item.fullName`]="{ value, item }">
        <UserSoftDeleteIcon :model-value="item" />

        {{ value }}
      </template>

      <template #[`item.memberships`]="{ value, item }">
        <v-chip
          :text="`${value.length}`"
          :variant="!value.length ? 'outlined' : undefined"
          prepend-icon="mdi-domain"
          size="small"
          @click="membershipsDialogRef?.open(item)"
        />
      </template>

      <template #[`item.isAdmin`]="{ item }">
        <v-icon v-if="item.isAdmin" icon="mdi-security" />
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
              v-if="userFormDialogRef"
              :title="$t('modify')"
              prepend-icon="mdi-pencil"
              @click="userFormDialogRef.open(item)"
            />
            <v-list-item
              :title="$t('delete')"
              prepend-icon="mdi-delete"
              @click="deleteUsers([item])"
            />

            <v-divider />

            <v-list-item
              :title="$t('authenticate.impersonate')"
              prepend-icon="mdi-login"
              @click="impersonateDialogRef?.open(item)"
            />
            <v-list-item
              v-if="clipboard"
              :title="$t('users.createMailUserList')"
              prepend-icon="mdi-email"
              @click="copyUserUsername(item)"
            />
          </v-list>
        </v-menu>
      </template>
    </v-data-table-server>

    <SelectionMenu
      v-model="selectedUsers"
      :text="$t('users.manageUsers', selectedUsers.length)"
    >
      <template #actions>
        <v-list-item
          :title="$t('users.createMailUserList', 2)"
          prepend-icon="mdi-email-multiple"
          @click="copyMailList()"
        />

        <v-list-item
          :title="$t('delete')"
          prepend-icon="mdi-delete"
          @click="deleteUsers()"
        />
      </template>
    </SelectionMenu>

    <UserFormDialog
      ref="userFormDialogRef"
      @submit="refresh()"
    />

    <UserMembershipsDialog
      ref="membershipsDialogRef"
      @update:model-value="refresh()"
    />
    <UserImpersonateDialog
      ref="impersonateDialogRef"
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

const selectedUsers = ref([]);

const userFormDialogRef = useTemplateRef('userFormDialogRef');
const membershipsDialogRef = useTemplateRef('membershipsDialogRef');
const impersonateDialogRef = useTemplateRef('impersonateDialogRef');

const {
  refresh,
  itemLength,
  query,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: '/api/users',
    query: {
      include: ['memberships'],
    },
  },
  sortMapping: {
    memberships: 'memberships._count',
  },
  data: {
    sortBy: [{ key: 'username', order: 'asc' }],
    source: '*',
  },
});

/**
 * Table headers
 */
const headers = computed(() => [
  {
    title: t('users.user.fullName'),
    value: 'fullName',
    sortable: true,
  },
  {
    title: t('users.user.username'),
    value: 'username',
    sortable: true,
  },
  {
    title: t('users.user.email'),
    value: 'email',
    sortable: true,
  },
  {
    title: t('users.user.isAdmin'),
    value: 'isAdmin',
    sortable: true,
    align: 'center',
    width: '200px',
  },
  {
    title: t('users.user.memberships'),
    value: 'memberships',
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
  return t('users.toolbarTitle', { count: count ?? '?' });
});

/**
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(refresh, 250);

/**
 * Delete multiple users
 *
 * @param {Object[]} [items] List of items to delete, if none it'll fall back to selected
 */
function deleteUsers(items) {
  const toDelete = items || selectedUsers.value;
  if (toDelete.length <= 0) {
    return;
  }

  openConfirm({
    title: t('areYouSure'),
    text: t(
      'users.deleteNbUsers',
      toDelete.length,
    ),
    agreeText: t('delete'),
    agreeIcon: 'mdi-delete',
    onAgree: async () => {
      const results = await Promise.all(
        toDelete.map(
          (item) => $fetch(`/api/users/${item.username}`, { method: 'DELETE' })
            .catch((err) => {
              snacks.error(t('cannotDeleteItem', { id: item.username }), err);
              return null;
            }),
        ),
      );

      if (!results.some((r) => !r)) {
        snacks.success(t('itemsDeleted', { count: toDelete.length }));
      }

      if (!items) {
        selectedUsers.value = [];
      }

      await refresh();
    },
  });
}

/**
 * Put user ID into clipboard
 *
 * @param {object} param0 User
 */
async function copyUserUsername({ username }) {
  if (!username) {
    return;
  }

  try {
    await copy(username);
  } catch (err) {
    snacks.error(t('clipboard.unableToCopy'), err);
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}

/**
 * Put users email into clipboard
 *
 * @param {object} param0 User
 */
async function copyMailList(items) {
  const toCopy = items || selectedUsers.value;
  if (toCopy.length <= 0) {
    return;
  }

  const addresses = toCopy.map((u) => u.email).filter((v) => !!v);

  try {
    await copy(addresses.join('; '));
  } catch (err) {
    snacks.error(t('clipboard.unableToCopy'), err);
    return;
  }
  snacks.info(t('emailsCopied'));
}
</script>
