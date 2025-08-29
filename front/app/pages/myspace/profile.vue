<template>
  <div>
    <SkeletonPageBar :title="$t('menu.credentials')" />

    <v-container>
      <v-row>
        <v-col>
          <v-card :title="$t('myspace.title')">
            <template #append>
              <v-btn :href="refreshProfileURL" variant="text">
                <v-icon left>
                  mdi-refresh
                </v-icon>
                {{ $t('refreshShib') }}
              </v-btn>
            </template>

            <template #text>
              <v-list density="compact">
                <v-list-item
                  v-for="field in fields"
                  :key="field.name"
                  :prepend-icon="field.icon"
                  :title="field.value"
                  :subtitle="$t(`myspace.${field.name}`)"
                  lines="two"
                />
              </v-list>
            </template>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-card :title="apiKeysTitle" :loading="apiKeysStatus === 'pending' && 'primary'">
            <template #append>
              <v-btn
                v-if="apiKeyFormDialogRef"
                :text="$t('add')"
                prepend-icon="mdi-plus"
                variant="tonal"
                color="green"
                class="mr-2"
                @click="apiKeyFormDialogRef.open(undefined, { user })"
              />

              <v-btn
                :text="$t('refresh')"
                :loading="apiKeysStatus === 'pending'"
                prepend-icon="mdi-reload"
                variant="tonal"
                color="primary"
                class="mr-2"
                @click="apiKeysRefresh()"
              />
            </template>

            <template #text>
              <i18n-t keypath="api-keys.whatDoesKey.text" tag="p" class="mb-4">
                <template #header>
                  <v-code>{{ $t('api-keys.whatDoesKey.header') }}</v-code>
                </template>
              </i18n-t>

              <v-alert
                v-if="apiKeysError"
                :title="$t('anErrorOccurred')"
                :text="getErrorMessage(apiKeysError)"
                type="error"
                class="mb-4"
              />

              <v-data-table-server
                v-model="selectedKeys"
                :headers="apiKeysHeaders"
                show-select
                show-expand
                signle-expand
                return-object
                v-bind="apiKeysVDataTableOptions"
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
                            :key="item.aliasPattern"
                            :title="item.aliasPattern"
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
                    :loading="apiKeyActiveLoadingMap.get(item.id)"
                    density="compact"
                    color="primary"
                    hide-details
                    class="mt-0"
                    style="transform: scale(0.8);"
                    @update:model-value="toggleKeyActiveStates([item])"
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
                        prepend-icon="mdi-pencil"
                        @click="apiKeyFormDialogRef.open(item, { user })"
                      />

                      <v-list-item
                        :title="$t('revoke')"
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
                      <ApiKeyDetails :model-value="item" :user="user" />
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
                    prepend-icon="mdi-delete"
                    @click="deleteApiKeys()"
                  />

                  <v-divider />

                  <v-list-item
                    :title="$t('institutions.sushi.activeSwitch')"
                    prepend-icon="mdi-toggle-switch"
                    @click="toggleKeyActiveStates()"
                  />
                </template>
              </SelectionMenu>

              <ApiKeyFormDialog
                ref="apiKeyFormDialogRef"
                @submit="debouncedApiKeysRefresh()"
              />
            </template>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-card :title="$t('token.title')" :loading="tokenStatus === 'pending' && 'primary'">
            <template #text>
              <v-alert
                type="info"
                :text="$t('token.deprecated')"
                class="mb-4"
              />

              <i18n-t keypath="token.whatDoesToken.text" tag="p" class="mb-4">
                <template #header>
                  <v-code>{{ $t('token.whatDoesToken.header') }}</v-code>
                </template>
              </i18n-t>

              <v-alert
                v-if="tokenError"
                :title="$t('anErrorOccurred')"
                :text="getErrorMessage(tokenError)"
                type="error"
                class="mb-4"
              />

              <v-text-field
                :label="$t('token.token')"
                :model-value="token"
                :type="showToken ? 'text' : 'password'"
                :append-inner-icon="showToken ? 'mdi-eye-off' : 'mdi-eye'"
                variant="outlined"
                hide-details
                readonly
                @click:append-inner="() => (showToken = !showToken)"
              >
                <template v-if="clipboard" #append>
                  <v-btn
                    :text="$t('copy')"
                    prepend-icon="mdi-clipboard-text"
                    density="comfortable"
                    variant="text"
                    @click="copyTokenToClipboard()"
                  />
                </template>
              </v-text-field>
            </template>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { isAfter } from 'date-fns';

import { getErrorMessage } from '@/lib/errors';

definePageMeta({
  layout: 'space',
  middleware: ['sidebase-auth', 'terms'],
});

const { t, locale } = useI18n();
const { data: user } = useAuthState();
const { isSupported: clipboard, copy } = useClipboard();
const { openConfirm } = useDialogStore();
const snacks = useSnacksStore();

const showToken = shallowRef(false);
const selectedKeys = ref([]);
const apiKeyActiveLoadingMap = ref(new Map());

const apiKeyFormDialogRef = useTemplateRef('apiKeyFormDialogRef');

const {
  data: token,
  status: tokenStatus,
  error: tokenError,
} = await useFetch('/api/auth/token', {
  lazy: true,
});

const {
  status: apiKeysStatus,
  error: apiKeysError,
  itemLength: apiKeysItemLength,
  vDataTableOptions: apiKeysVDataTableOptions,
  refresh: apiKeysRefresh,
} = await useServerSidePagination({
  fetch: {
    url: '/api/auth/api-keys',
    query: {
      include: [
        'repositoryPermissions.repository',
        'repositoryAliasPermissions.alias.repository',
      ],
    },
  },
  sortMapping: {
    repositoryPermissions: 'repositoryPermissions._count',
    repositoryAliasPermissions: 'repositoryAliasPermissions._count',
  },
  data: {
    sortBy: [{ key: 'name', order: 'asc' }],
  },
  async: {
    deep: true,
  },
});

const refreshProfileURL = computed(() => {
  const currentLocation = encodeURIComponent(window.location.href);
  return `/api/auth/oauth/login?refresh=1&origin=${currentLocation}`;
});

const fields = computed(
  () => [
    { name: 'name', value: user.value.fullName, icon: 'mdi-account' },
    { name: 'mail', value: user.value.email, icon: 'mdi-email' },
    { name: 'idp', value: user.value.metadata?.idp, icon: 'mdi-web' },
    { name: 'organization', value: user.value.metadata?.org, icon: 'mdi-domain' },
    { name: 'unit', value: user.value.metadata?.unit, icon: 'mdi-account-group' },
  ].filter((f) => f.value),
);

/**
 * API keys table headers
 */
const apiKeysHeaders = computed(() => [
  {
    title: t('name'),
    value: 'name',
    sortable: true,
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
 * API keys toolbar title
 */
const apiKeysTitle = computed(() => {
  let count = `${apiKeysItemLength.value.current}`;
  if (apiKeysItemLength.value.current !== apiKeysItemLength.value.total) {
    count = `${apiKeysItemLength.value.current}/${apiKeysItemLength.value.total}`;
  }
  return t('api-keys.title', { count: count ?? '?' });
});

/**
 * Debounced api keys refresh
 */
const debouncedApiKeysRefresh = useDebounceFn(apiKeysRefresh, 250);

async function copyTokenToClipboard() {
  if (!token.value) {
    return;
  }

  try {
    await copy(token.value);
  } catch (err) {
    snacks.error(t('clipboard.unableToCopy'), err);
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}
/**
 * Toggle active states for selected api keys
 *
 * @param {any[]} items api keys to toggle, defaults to selected
 */
async function toggleKeyActiveStates(items) {
  const toToggle = items || selectedKeys.value;
  if (toToggle.length <= 0) {
    return;
  }

  await Promise.all(
    toToggle.map(async (item) => {
      apiKeyActiveLoadingMap.value.set(item.id, true);
      try {
        const active = !item.active;
        // eslint-disable-next-line no-await-in-loop
        await $fetch(`/api/auth/api-keys/${item.id}`, {
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
        apiKeyActiveLoadingMap.value.set(item.id, false);
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
          (item) => $fetch(`/api/auth/api-keys/${item.id}`, {
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
        selectedKeys.value = [];
      }

      await apiKeysRefresh();
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
