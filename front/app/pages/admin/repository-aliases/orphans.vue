<template>
  <div>
    <SkeletonPageBar
      v-model:search="search"
      :title="toolbarTitle"
      :refresh="refresh"
      icons
    />

    <v-container fluid>
      <v-row>
        <v-col>
          <p>{{ $t('orphanAliases.pageDescription') }}</p>
        </v-col>
      </v-row>
    </v-container>

    <v-data-table
      :items="orphanAliases"
      :headers="headers"
      :sort-by="[{ key: 'alias' }]"
      :loading="loading"
      :search="search"
      return-object
    >
      <template #[`item.filter`]="{ item }">
        <v-menu
          v-if="item.filter"
          :close-on-content-click="false"
          location="left top"
        >
          <template #activator="{ props }">
            <v-icon icon="mdi-filter" size="small" v-bind="props" />
          </template>

          <v-textarea
            :value="JSON.stringify(item.filter, null, 2)"
            textarea
            readonly
            variant="solo"
            hide-details
            class="pl-1 pt-0"
            rows="10"
            min-width="400"
          />
        </v-menu>
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
              v-if="clipboard"
              :title="$t('copyId')"
              prepend-icon="mdi-identifier"
              @click="copyToClipboard(item.alias)"
            />
          </v-list>
        </v-menu>
      </template>
    </v-data-table>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['sidebase-auth', 'terms', 'admin'],
});

const { t } = useI18n();
const { isSupported: clipboard, copy } = useClipboard();
const snacks = useSnacksStore();

const search = shallowRef('');

const {
  data: orphanAliases,
  error,
  refresh,
  status,
} = await useFetch('/api/repository-aliases/_orphans', { method: 'GET' });

const loading = computed(() => status.value === 'pending');
const toolbarTitle = computed(() => t('orphanAliases.toolbarTitle', { count: orphanAliases.value?.length ?? 0 }));

/**
 * Table headers
 */
const headers = computed(() => [
  {
    title: t('repositories.pattern'),
    value: 'alias',
    sortable: true,
  },
  {
    title: t('repositoryAliases.target'),
    value: 'index',
    sortable: true,
  },
  {
    title: t('repoAliasTemplates.filters'),
    value: 'filter',
    align: 'center',
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
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(refresh, 250);

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
