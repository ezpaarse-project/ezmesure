<template>
  <SkeletonPageLoader
    v-if="!institution"
    :error="error"
    show
    show-refresh
    @click:refresh="refresh()"
  />
  <div v-else>
    <SkeletonPageBar
      v-model="query"
      :refresh="refresh"
      search
      @update:model-value="debouncedRefresh()"
    >
      <template #title>
        <InstitutionBreadcrumbs :institution="institution" :current="toolbarTitle" />
      </template>

      <MembershipAddMenu
        :institution="institution"
        @update:model-value="membershipFormDialogRef?.open($event, { institution })"
      >
        <template #activator="{ props }">
          <v-btn
            :text="$t('add')"
            :disabled="!canEdit"
            prepend-icon="mdi-plus"
            variant="tonal"
            color="green"
            class="mr-2"
            v-bind="props"
          />
        </template>
      </MembershipAddMenu>
    </SkeletonPageBar>

    <v-data-table-server
      v-model="selectedMembers"
      :headers="headers"
      show-select
      return-object
      v-bind="vDataTableOptions"
    >
      <template #[`item.user.fullName`]="{ value, item }">
        <div class="d-flex">
          {{ value }}

          <v-spacer />

          <v-icon
            v-if="item.comment"
            v-tooltip:right="{ text: item.comment, maxWidth: 500 }"
            icon="mdi-information-outline"
            color="grey-darken-2"
          />
        </div>
      </template>

      <template #[`item.roles`]="{ value }">
        <v-chip
          v-for="role in value"
          :key="role"
          :text="$t(`institutions.members.roleNames.${role}`)"
          :prepend-icon="roleColors.get(role)?.icon"
          :color="roleColors.get(role)?.color"
          size="small"
          label
          class="mr-1"
        />
      </template>

      <template #[`item.repositoryPermissions`]="{ value, item }">
        <v-chip
          :text="`${value.length}`"
          :variant="!value.length ? 'outlined' : undefined"
          :disabled="!canEdit || !membershipFormDialogRef"
          prepend-icon="mdi-database-outline"
          size="small"
          @click="membershipFormDialogRef?.open(item, { institution })"
        />
      </template>

      <template #[`item.spacePermissions`]="{ value, item }">
        <v-chip
          :text="`${value.length}`"
          :variant="!value.length ? 'outlined' : undefined"
          :disabled="!canEdit || !membershipFormDialogRef"
          prepend-icon="mdi-tab"
          size="small"
          @click="membershipFormDialogRef?.open(item, { institution })"
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
              :title="$t('revoke')"
              :disabled="!canEdit"
              prepend-icon="mdi-account-off"
              @click="deleteMembers([item])"
            />

            <v-divider />

            <v-list-item
              v-if="membershipFormDialogRef"
              :title="$t('institutions.members.changePermissions')"
              :disabled="!canEdit"
              prepend-icon="mdi-shield"
              @click="membershipFormDialogRef.open(item, { institution })"
            />
          </v-list>
        </v-menu>
      </template>
    </v-data-table-server>

    <SelectionMenu
      v-model="selectedMembers"
      :text="$t('institutions.members.manageN', selectedMembers.length)"
    >
      <template #actions>
        <v-list-item
          :title="$t('revoke')"
          :disabled="!canEdit"
          prepend-icon="mdi-account-off"
          @click="deleteMembers()"
        />
        <v-list-item
          v-if="clipboard"
          :title="$t('institutions.members.createMailList')"
          prepend-icon="mdi-email-multiple"
          @click="copyEmails()"
        />
      </template>
    </SelectionMenu>

    <MembershipFormDialog
      ref="membershipFormDialogRef"
      @update:model-value="debouncedRefresh()"
    />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'space',
  middleware: ['auth', 'terms'],
  alias: ['/admin/institutions/:id/members'],
});

const { params } = useRoute();
const { t } = useI18n();
const { data: user } = useAuthState();
const { hasPermission } = useCurrentUserStore();
const { isSupported: clipboard, copy } = useClipboard();
const { openConfirm } = useDialogStore();
const snacks = useSnacksStore();

const selectedMembers = ref([]);

const membershipFormDialogRef = useTemplateRef('membershipFormDialogRef');

const {
  error,
  data: institution,
} = await useFetch(`/api/institutions/${params.id}`);

const {
  refresh,
  itemLength,
  query,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: `/api/institutions/${params.id}/memberships`,
  },
  sortMapping: {
    repositoryPermissions: 'repositoryPermissions._count',
    spacePermissions: 'spacePermissions._count',
  },
  data: {
    sortBy: [{ key: 'user.fullName', order: 'asc' }],
    include: ['user', 'repositoryPermissions', 'spacePermissions'],
  },
});

/**
 * If user can edit members
 */
const canEdit = computed(() => {
  if (user.value?.isAdmin) {
    return true;
  }
  return hasPermission('memberships:write', { throwOnNoMembership: true });
});
/**
 * Table headers
 */
const headers = computed(() => [
  {
    title: t('institutions.members.name'),
    value: 'user.fullName',
    sortable: true,
  },
  {
    title: t('institutions.members.username'),
    value: 'username',
    sortable: true,
  },
  {
    title: t('users.user.email'),
    value: 'user.email',
    sortable: true,
  },
  {
    title: t('institutions.members.roles'),
    value: 'roles',
    sortable: true,
  },
  {
    title: t('institutions.members.accessRights'),
    value: 'accessRights',
    children: [
      {
        title: t('repositories.repositories'),
        value: 'repositoryPermissions',
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
  return t('institutions.members.title', { count: count ?? '?' });
});

/**
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(refresh, 250);

/**
 * Delete multiple members
 *
 * @param {Object[]} [items] List of items to delete, if none it'll fall back to selected
 */
function deleteMembers(items) {
  const toDelete = items || selectedMembers.value;
  if (toDelete.length <= 0) {
    return;
  }

  openConfirm({
    title: t('areYouSure'),
    text: t(
      'institutions.members.deleteN',
      toDelete.length,
    ),
    agreeText: t('revoke'),
    agreeIcon: 'mdi-account-off',
    onAgree: async () => {
      const results = await Promise.all(
        toDelete.map((item) => {
          try {
            return $fetch(`/api/institutions/${institution.value.id}/memberships/${item.username}`, {
              method: 'DELETE',
            });
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
        selectedMembers.value = [];
      }

      await refresh();
    },
  });
}

async function copyEmails(items) {
  const emails = (items || selectedMembers.value).map((item) => item.user.email);
  if (emails.length <= 0) {
    return;
  }

  try {
    await copy(emails.join(';'));
  } catch {
    snacks.error(t('clipboard.unableToCopy'));
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}
</script>

<style scoped>

</style>
