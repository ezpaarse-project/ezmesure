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

      <v-btn
        v-if="apiKeyFormDialogRef"
        :text="$t('add')"
        :disabled="!canEdit"
        prepend-icon="mdi-plus"
        variant="tonal"
        color="green"
        class="mr-2"
        @click="apiKeyFormDialogRef.open(undefined, { institution })"
      />
    </SkeletonPageBar>

    <v-data-table-server
      v-model="selectedKeys"
      :headers="headers"
      show-select
      show-expand
      signle-expand
      return-object
      v-bind="vDataTableOptions"
    >
      <template #[`item.repositoryPermissions`]="{ value }">
        <v-menu :disabled="value.length <= 0" location="start">
          <template #activator="{ props: menu }">
            <v-chip
              :text="`${value.length}`"
              :variant="!value.length ? 'outlined' : undefined"
              prepend-icon="mdi-database-outline"
              size="small"
              v-bind="menu"
            />
          </template>

          <v-card :title="$t('repositories.repositories')" density="compact">
            <template #text>
              <v-list lines="two" density="compact">
                <v-list-item
                  v-for="item in value"
                  :key="item.pattern"
                  :title="item.pattern"
                >
                  <template #subtitle>
                    <RepositoryTypeChip :model-value="item.repository" size="small" />
                  </template>

                  <template #append>
                    <v-icon
                      v-tooltip:top="$t(`permissions.${item.readonly ? 'read' : 'write'}`)"
                      :icon="permLevelColors.get(item.readonly ? 'read' : 'write')?.icon"
                      end
                    />
                  </template>
                </v-list-item>
              </v-list>
            </template>
          </v-card>
        </v-menu>
      </template>

      <template #[`item.repositoryAliasPermissions`]="{ value }">
        <v-menu :disabled="value.length <= 0" location="end">
          <template #activator="{ props: menu }">
            <v-chip
              :text="`${value.length}`"
              :variant="!value.length ? 'outlined' : undefined"
              prepend-icon="mdi-database-eye-outline"
              size="small"
              v-bind="menu"
            />
          </template>

          <v-card :title="$t('repositoryAliases.aliases')" density="compact">
            <template #text>
              <v-list lines="two" density="compact">
                <v-list-item
                  v-for="item in value"
                  :key="item.pattern"
                  :title="item.pattern"
                >
                  <template #subtitle>
                    <RepositoryTypeChip :model-value="item.alias.repository" size="small" />
                  </template>
                </v-list-item>
              </v-list>
            </template>
          </v-card>
        </v-menu>
      </template>

      <template #[`item.active`]="{ item }">
        <v-switch
          v-tooltip:left="$t(`endpoints.${item.active ? 'activeSince' : 'inactiveSince'}`, { date: dateFormat(item.activeUpdatedAt, locale) })"
          :model-value="item.active"
          :label="item.active ? $t('endpoints.active') : $t('endpoints.inactive')"
          :loading="activeLoadingMap.get(item.id)"
          :readonly="!canEdit"
          density="compact"
          color="primary"
          hide-details
          class="mt-0"
          style="transform: scale(0.8);"
          @update:model-value="toggleActiveStates([item])"
        />
      </template>

      <template #[`item.expiresAt`]="{ value }">
        <div v-if="value" :style="{ color: isAfter(now, value) ? 'red' : undefined }">
          <LocalDate
            :model-value="value"
          />
        </div>
        <span v-else>{{ $t('never') }}</span>
      </template>

      <template #[`item.lastActivity`]="{ value }">
        <LocalDate :model-value="value" />
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
              v-if="apiKeyFormDialogRef"
              :title="$t('modify')"
              :disabled="!canEdit"
              prepend-icon="mdi-pencil"
              @click="apiKeyFormDialogRef.open(item, { institution })"
            />

            <v-list-item
              :title="$t('revoke')"
              :disabled="!canEdit"
              prepend-icon="mdi-delete"
              @click="deleteApiKeys([item])"
            />

            <v-divider />

            <v-list-item
              v-if="clipboard"
              :title="$t('copyId')"
              prepend-icon="mdi-identifier"
              @click="copyKeyId(item)"
            />
          </v-list>
        </v-menu>
      </template>

      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length">
            <ApiKeyDetails :model-value="item" :institution="institution" />
          </td>
        </tr>
      </template>
    </v-data-table-server>

    <SelectionMenu
      v-model="selectedKeys"
      :text="$t('api-keys.manageN', selectedKeys.length)"
    >
      <template #actions>
        <v-list-item
          :title="$t('revoke')"
          :disabled="!canEdit"
          prepend-icon="mdi-delete"
          @click="deleteApiKeys()"
        />

        <v-divider />

        <v-list-item
          :title="$t('institutions.sushi.activeSwitch')"
          :disabled="!canEdit"
          prepend-icon="mdi-toggle-switch"
          @click="toggleActiveStates()"
        />
      </template>
    </SelectionMenu>

    <ApiKeyFormDialog
      ref="apiKeyFormDialogRef"
      @submit="debouncedRefresh()"
    />
  </div>
</template>

<script setup>
import { isAfter } from 'date-fns';

definePageMeta({
  layout: 'space',
  middleware: ['sidebase-auth', 'terms'],
  alias: ['/admin/institutions/:id/api-keys'],
});

const now = new Date();

const { params } = useRoute();
const { t, locale } = useI18n();
const { isSupported: clipboard, copy } = useClipboard();
const { data: user } = useAuthState();
const { hasPermission } = useCurrentUserStore();
const { openConfirm } = useDialogStore();
const snacks = useSnacksStore();

const selectedKeys = ref([]);
const activeLoadingMap = ref(new Map());

const apiKeyFormDialogRef = useTemplateRef('apiKeyFormDialogRef');

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
    url: `/api/institutions/${params.id}/api-keys`,
    query: {
      include: [
        'user',
        'repositoryPermissions.repository',
        'repositoryAliasPermissions.alias',
      ],
    },
  },
  sortMapping: {
    repositoryPermissions: 'repositoryPermissions._count',
  },
  data: {
    sortBy: [{ key: 'name', order: 'asc' }],
  },
  async: {
    deep: true,
  },
});

/**
 * If user can edit api keys
 */
const canEdit = computed(() => {
  if (user.value?.isAdmin) {
    return true;
  }
  return hasPermission(params.id, 'api-keys:write', { throwOnNoMembership: true });
});
/**
 * Table headers
 */
const headers = computed(() => [
  {
    title: t('name'),
    value: 'name',
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
    ],
  },
  {
    title: t('api-keys.expiresAt'),
    value: 'expiresAt',
    align: 'center',
    sortable: true,
  },
  {
    title: t('status'),
    value: 'active',
    sortable: true,
  },
  {
    title: t('users.user.lastActivity'),
    value: 'lastActivity',
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
  return t('api-keys.title', { count: count ?? '?' });
});

/**
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(refresh, 250);

/**
 * Toggle active states for selected api keys
 *
 * @param {any[]} items api keys to toggle, defaults to selected
 */
async function toggleActiveStates(items) {
  const toToggle = items || selectedKeys.value;
  if (toToggle.length <= 0) {
    return;
  }

  await Promise.all(
    toToggle.map(async (item) => {
      activeLoadingMap.value.set(item.id, true);
      try {
        const active = !item.active;
        // eslint-disable-next-line no-await-in-loop
        await $fetch(`/api/institutions/${item.institutionId}/api-keys/${item.id}`, {
          method: 'PUT',
          body: {
            name: item.name,
            description: item.description,
            expiresAt: item.expiresAt,
            active,
          },
        });

        // eslint-disable-next-line no-param-reassign
        item.active = active;
        return item;
      } catch (err) {
        snacks.error(t('.unableToUpdate'), err);
        return null;
      } finally {
        activeLoadingMap.value.set(item.id, false);
      }
    }),
  );

  if (!items) {
    selectedKeys.value = [];
  }
}

/**
 * Delete multiple api keys
 *
 * @param {Object[]} [items] List of items to delete, if none it'll fall back to selected
 */
function deleteApiKeys(items) {
  const toDelete = items || selectedKeys.value;
  if (toDelete.length <= 0) {
    return;
  }

  openConfirm({
    text: t(
      'api-keys.deleteN',
      toDelete.length,
    ),
    agreeText: t('delete'),
    agreeIcon: 'mdi-delete',
    onAgree: async () => {
      const results = await Promise.all(
        toDelete.map(
          (item) => $fetch(`/api/institutions/${institution.value.id}/api-keys/${item.id}`, {
            method: 'DELETE',
          }).catch((err) => {
            snacks.error(t('cannotDeleteItem', { id: item.name || item.id }), err);
            return null;
          }),
        ),
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

/**
 * Put key ID into clipboard
 *
 * @param {object} param0 API key
 */
async function copyKeyId({ id }) {
  if (!id) {
    return;
  }

  try {
    await copy(id);
  } catch (err) {
    snacks.error(t('clipboard.unableToCopy'), err);
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}
</script>
