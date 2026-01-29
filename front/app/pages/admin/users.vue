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
              v-if="!!item.deletedAt"
              :title="$t('delete')"
              prepend-icon="mdi-delete"
              @click="deleteUsers([item])"
            />
            <v-list-item
              v-else
              :title="$t('users.actions.disable.title')"
              :disabled="!!item.deletedAt"
              prepend-icon="mdi-account-cancel"
              @click="disableUsers([item])"
            />

            <v-divider />

            <v-list-item
              :title="$t('users.actions.restore.title')"
              :disabled="!item.deletedAt"
              prepend-icon="mdi-account-check"
              @click="restoreUsers([item])"
            />

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

        <v-list-item
          :title="$t('users.actions.disable.title')"
          prepend-icon="mdi-account-cancel"
          @click="disableUsers()"
        />

        <v-list-item
          :title="$t('users.actions.restore.title')"
          prepend-icon="mdi-account-check"
          @click="restoreUsers()"
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
import { millisecondsInDay } from 'date-fns/constants';

/**
 * @typedef {import('~/stores/dialog').DialogData} DialogData
 */

definePageMeta({
  layout: 'admin',
  middleware: ['sidebase-auth', 'terms', 'admin'],
});

const { data: apiConfig } = await useApiConfig();
const { t, locale } = useI18n();
const { isSupported: clipboard, copy } = useClipboard();
const { openConfirm } = useConfirmStore();
const snacks = useSnacksStore();

const selectedUsers = ref([]);

const userFormDialogRef = useTemplateRef('userFormDialogRef');
const membershipsDialogRef = useTemplateRef('membershipsDialogRef');
const impersonateDialogRef = useTemplateRef('impersonateDialogRef');

const deleteDuration = computed(() => {
  const deleteDurationDays = apiConfig?.value?.users?.deleteDurationDays;
  return timeAgo(deleteDurationDays * millisecondsInDay, locale.value) ?? '...';
});

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
 * @typedef {Object} BulkActionData
 * @property {(item: Object) => Promise<unknown>} action - The action
 * @property {(item: Object) => string} error - Triggered on error, can return error message
 * @property {() => string} success - Triggered when all actions succeed, can return success message
 */

/**
 * Do an action on given items, or selected users
 *
 * @param {Object[] | undefined} items - List of items
 * @param {DialogData & BulkActionData} options
 */
async function bulkActionWithConfirm(items, options) {
  if (items.length <= 0) {
    return;
  }

  await openConfirm({
    title: t('areYouSure'),
    ...options,
    onAgree: async () => {
      const results = await Promise.all(
        items.map(
          (item) => options.action(item)
            .catch((err) => {
              snacks.error(options.error(item), err);
              return null;
            }),
        ),
      );

      if (!results.some((r) => !r)) {
        snacks.success(options.success());
      }

      await refresh();
    },
  });
}

/**
 * Delete multiple users
 *
 * @param {Object[]} [items] List of items to delete, if none it'll fall back to selected
 */
async function deleteUsers(items) {
  const toDelete = items || selectedUsers.value;

  await bulkActionWithConfirm(toDelete, {
    text: t('users.deleteNbUsers', toDelete.length),
    agreeText: t('delete'),
    agreeIcon: 'mdi-delete',

    action: (item) => $fetch(`/api/users/${item.username}`, { method: 'DELETE', query: { force: true } }),
    error: (item) => t('cannotDeleteItem', { id: item.username }),
    success: () => t('itemsDeleted', { count: toDelete.length }),
  });

  if (!items) {
    selectedUsers.value = [];
  }
}

/**
 * Disable multiple users
 *
 * @param {Object[]} [items] List of items to disable, if none it'll fall back to selected
 */
async function disableUsers(items) {
  const toDisable = items || selectedUsers.value;

  await bulkActionWithConfirm(toDisable, {
    text: t('users.actions.disable.confirm.text', { duration: deleteDuration.value }),
    agreeText: t('users.actions.disable.confirm.agree'),
    agreeIcon: 'mdi-account-cancel',

    action: (item) => $fetch(`/api/users/${item.username}`, { method: 'DELETE' }),
    error: (item) => t('users.actions.disable.error', { id: item.username }),
    success: () => t('users.actions.disable.success', toDisable.length),
  });

  if (!items) {
    selectedUsers.value = [];
  }
}

/**
 * Cancel deletion of multiple users
 *
 * @param {Object[]} [items] List of items to cancel, if none it'll fall back to selected
 */
async function restoreUsers(items) {
  const toRestore = items || selectedUsers.value;

  await bulkActionWithConfirm(toRestore, {
    text: t('users.actions.restore.confirm.text', toRestore.length),
    agreeText: t('users.actions.restore.confirm.agree'),
    agreeIcon: 'mdi-account-check',

    action: (item) => $fetch(`/api/users/${item.username}`, { method: 'PATCH', body: { deletedAt: null } }),
    error: (item) => t('users.actions.restore.error', { id: item.username }),
    success: () => t('users.actions.restore.success', toRestore.length),
  });

  if (!items) {
    selectedUsers.value = [];
  }
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
