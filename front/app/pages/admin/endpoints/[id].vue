<template>
  <SkeletonPageLoader
    v-if="!endpoint"
    :error="error"
    show
    show-refresh
    @click:refresh="refresh()"
  />
  <div v-else>
    <SkeletonPageBar
      v-model:search="search"
      v-model:filters="filters"
      :refresh="refresh"
      :title="endpoint.vendor"
      icons
    >
      <template #filters-panel="props">
        <SushiApiFilters v-bind="props" />
      </template>

      <v-switch
        v-tooltip:left="$t(`endpoints.${endpoint.active ? 'activeSince' : 'inactiveSince'}`, { date: dateFormat(endpoint.activeUpdatedAt, locale) })"
        :model-value="endpoint.active"
        :label="endpoint.active ? $t('endpoints.active') : $t('endpoints.inactive')"
        :loading="loading"
        density="compact"
        color="primary"
        hide-details
        class="mt-0 mr-2"
        style="transform: scale(0.9);"
        @update:model-value="toggleActiveStates()"
      />

      <v-btn
        v-if="endpointFormDialogRef"
        v-tooltip="$t('modify')"
        icon="mdi-pencil"
        variant="tonal"
        density="comfortable"
        color="blue"
        class="mr-2"
        @click="endpointFormDialogRef.open(endpoint)"
      />

      <v-btn
        v-if="endpoint.registryId"
        v-tooltip="$t('endpoints.goToRegistry')"
        :href="registryUrl.href"
        icon="mdi-open-in-new"
        variant="tonal"
        density="comfortable"
        color="secondary"
        target="_blank"
        rel="noopener noreferrer"
        class="mr-6"
      />
    </SkeletonPageBar>

    <v-container fluid>
      <v-row v-if="endpoint">
        <v-slide-x-transition>
          <v-col v-if="!endpoint.active" cols="6">
            <v-alert
              :title="$t('endpoints.inactive')"
              :text="$t('endpoints.inactiveDescription')"
              type="warning"
              prominent
            />
          </v-col>
        </v-slide-x-transition>

        <v-slide-x-reverse-transition>
          <v-col v-if="(sushiMetrics?.failed ?? 0) > 0" cols="6">
            <v-alert
              :title="$t('sushi.problematicEndpoint')"
              :text="$t('sushi.nErrsCredentials', sushiMetrics.failed)"
              type="error"
              prominent
            >
              <template #append>
                <v-btn
                  :text="$t('show')"
                  size="small"
                  variant="outlined"
                  @click="filters.connection = 'failed'"
                />
              </template>
            </v-alert>
          </v-col>
        </v-slide-x-reverse-transition>
      </v-row>

      <v-row v-if="!sushiMetrics">
        <v-col v-for="i in 4" :key="i" cols="3">
          <v-skeleton-loader
            height="64"
            type="list-item-avatar"
          />
        </v-col>
      </v-row>

      <v-slide-y-transition>
        <v-row v-if="sushiMetrics">
          <v-col cols="3">
            <SimpleMetric
              :title="$t('sushi.institutions', sushiMetrics.institutions)"
              :value="`${sushiMetrics.institutions}`"
              icon="mdi-domain"
            />
          </v-col>

          <v-col cols="3">
            <SushiMetric
              :model-value="sushiMetrics.success || { total: 0 }"
              :title="$t('sushi.operationalCredentials')"
              icon="mdi-check"
              color="success"
            />
          </v-col>

          <v-col cols="3">
            <SushiMetric
              :model-value="sushiMetrics.untested || { total: 0 }"
              :title="$t('sushi.untestedCredentials')"
              :action-text="$t('show')"
              icon="mdi-bell-alert"
              color="info"
              @click="filters.connection = 'untested'"
            />
          </v-col>

          <v-col cols="3">
            <SushiMetric
              :model-value="sushiMetrics.unauthorized || { total: 0 }"
              :title="$t('sushi.invalidCredentials')"
              :action-text="$t('show')"
              icon="mdi-key-alert-outline"
              color="warning"
              @click="filters.connection = 'unauthorized'"
            />
          </v-col>
        </v-row>
      </v-slide-y-transition>

      <v-row class="mt-4">
        <v-col>
          <v-btn
            v-if="globalHarvestMatrixRef"
            :text="$t('sushi.globalHarvestState.title')"
            prepend-icon="mdi-table-headers-eye"
            size="small"
            variant="outlined"
            @click="globalHarvestMatrixRef.open()"
          />
        </v-col>
      </v-row>
    </v-container>

    <v-data-table
      :items="sushis ?? []"
      :headers="headers"
      :group-by="[{ key: 'institution.id' }]"
      :loading="status === 'pending' && 'primary'"
      :row-props="({ item }) => ({ class: shouldGreyRow(item) && 'bg-grey-lighten-4 text-grey' })"
      items-per-page="0"
      density="comfortable"
      hide-default-footer
      show-expand
    >
      <template #[`header.data-table-group`]>
        <div class="d-flex align-center">
          <v-checkbox
            :model-value="institutionsSelectionStatus === 'full'"
            :indeterminate="institutionsSelectionStatus === 'partial'"
            density="comfortable"
            hide-details
            @update:model-value="institutionsSelectionStatus === 'full'
              ? unselectInstitution()
              : selectInstitution()"
          />

          <span class="ml-11">
            {{ $t('institutions.title') }}
          </span>
        </div>
      </template>

      <template
        #group-header="{
          item,
          columns,
          toggleGroup,
          isGroupOpen,
        }"
      >
        <!-- eslint-disable-next-line vue/no-lone-template -->
        <tr :ref="registerGroup(item, isGroupOpen, toggleGroup)">
          <td :colspan="columns.length" class="bg-grey-lighten-3">
            <div class="d-flex align-center">
              <v-checkbox
                :model-value="selectedInstitutions.includes(item.value)"
                density="comfortable"
                hide-details
                @update:model-value="$event
                  ? selectInstitution(item.value)
                  : unselectInstitution(item.value)"
              />

              <v-btn
                :icon="isGroupOpen(item) ? '$expand' : '$next'"
                size="small"
                variant="text"
                @click="toggleGroup(item)"
              />

              <nuxt-link :to="`/admin/institutions/${item.value}/sushi`" class="ml-1">
                {{ institutionsMap.get(item.value)?.name || item.value }}
              </nuxt-link>

              <span class="ml-1">
                ({{ item.items.length }})
              </span>
            </div>
          </td>
        </tr>
      </template>

      <template #[`header.harvests`]="{ column: { title } }">
        <div>{{ title }}</div>

        <div class="d-flex justify-center align-center">
          <v-btn
            :disabled="status === 'pending'"
            color="primary"
            variant="text"
            density="comfortable"
            icon="mdi-arrow-left"
            @click="currentHarvestYear -= 1"
          />

          <span class="mx-3">
            {{ currentHarvestYear }}
          </span>

          <v-btn
            :disabled="status === 'pending' || currentHarvestYear >= MAX_HARVEST_YEAR"
            color="primary"
            variant="text"
            density="comfortable"
            icon="mdi-arrow-right"
            @click="currentHarvestYear += 1"
          />
        </div>
      </template>

      <template #[`item.packages`]="{ value }">
        <v-chip
          v-for="(pkg, index) in value"
          :key="index"
          :text="pkg"
          size="small"
          label
          class="mr-1"
        />
      </template>

      <template #[`item.connection`]="{ item }">
        <SushiConnectionChip
          :sushi="{ ...item, endpoint }"
          @update:model-value="item.connection = $event; debouncedRefresh()"
        />
      </template>

      <template #[`item.harvests`]="{ item }">
        <SushiHarvestStateChip
          v-if="item.harvests?.length > 0"
          :model-value="item.harvests"
          :endpoint="endpoint"
          :current-year="currentHarvestYear"
          @click:harvest="harvestMatrixRef?.open({ ...item, endpoint }, { period: $event.period })"
        />
      </template>

      <template #[`item.updatedAt`]="{ item }">
        <LocalDate :model-value="item.updatedAt" />
      </template>

      <template #[`item.status`]="{ item }">
        <SushiStateText :model-value="item" />
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
              :title="$t('institutions.sushi.checkCredentials')"
              prepend-icon="mdi-connection"
              @click="checkConnections([item])"
            />
            <v-list-item
              :title="$t('institutions.sushi.resetChecks')"
              prepend-icon="mdi-restore"
              @click="resetConnections([item])"
            />
            <v-list-item
              v-if="harvestMatrixRef"
              :title="$t('sushi.harvestState')"
              prepend-icon="mdi-table-headers-eye"
              @click="harvestMatrixRef?.open({ ...item, endpoint })"
            />
            <v-list-item
              v-if="reportsRef"
              :title="$t('reports.supportedReports')"
              prepend-icon="mdi-file-search"
              @click="reportsRef?.open(item)"
            />
            <v-list-item
              v-if="filesRef"
              :title="$t('sushi.showFiles')"
              prepend-icon="mdi-file-tree"
              @click="filesRef?.open(item)"
            />
            <v-list-item
              v-if="historyRef"
              :title="$t('tasks.history')"
              prepend-icon="mdi-history"
              @click="historyRef?.open(item)"
            />
            <v-list-item
              v-if="clipboard"
              :title="$t('sushi.copyId')"
              prepend-icon="mdi-identifier"
              @click="copySushiId(item)"
            />
          </v-list>
        </v-menu>
      </template>

      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length">
            <SushiDetails :model-value="{ ...item, endpoint }" />
          </td>
        </tr>
      </template>
    </v-data-table>

    <SelectionMenu
      v-model="selectedInstitutions"
      :text="$t('institutions.manageN', selectedInstitutions.length)"
    >
      <template #actions>
        <v-list-item
          v-if="clipboard"
          :title="$t('institutions.createMailContactList')"
          prepend-icon="mdi-email-multiple"
          @click="copyMailListOfInstitutions()"
        />
        <v-list-item
          :title="$t('institutions.sushi.checkCredentials')"
          prepend-icon="mdi-connection"
          @click="checkConnectionsOfInstitutions()"
        />
        <v-list-item
          :title="$t('institutions.sushi.resetChecks')"
          prepend-icon="mdi-restore"
          @click="resetConnectionsOfInstitutions()"
        />
      </template>
    </SelectionMenu>

    <SushiEndpointFormDialog
      ref="endpointFormDialogRef"
      @submit="refresh()"
    />

    <SushiHarvestMatrixDialog ref="harvestMatrixRef" />

    <SushiHarvestFilesDialog ref="filesRef" />

    <SushiHarvestHistoryDialog ref="historyRef" />

    <SushiReportsDialog ref="reportsRef" />

    <SushiEndpointHarvestGlobalMatrixDialog
      ref="globalHarvestMatrixRef"
      :endpoint="endpoint"
    />

    <InstitutionEmailsCopyDialog ref="emailsCopyDialogRef" />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['sidebase-auth', 'terms', 'admin'],
});

const MAX_HARVEST_YEAR = new Date().getFullYear();

const { params } = useRoute();
const { t, locale } = useI18n();
const { public: { counterRegistryUrl } } = useRuntimeConfig();
const { addToCheck } = useSushiCheckQueueStore();
const { isSupported: clipboard, copy } = useClipboard();
const { openConfirm } = useConfirmStore();
const snacks = useSnacksStore();

const search = shallowRef('');
const filters = ref({});
const sushiMetrics = ref(undefined);
const loading = shallowRef(false);
const selectedInstitutions = ref([]);
const currentHarvestYear = ref(MAX_HARVEST_YEAR);

const endpointFormDialogRef = useTemplateRef('endpointFormDialogRef');
const harvestMatrixRef = useTemplateRef('harvestMatrixRef');
const globalHarvestMatrixRef = useTemplateRef('globalHarvestMatrixRef');
const reportsRef = useTemplateRef('reportsRef');
const filesRef = useTemplateRef('filesRef');
const historyRef = useTemplateRef('historyRef');
const emailsCopyDialogRef = useTemplateRef('emailsCopyDialogRef');

const debouncedSearch = useDebounce(search, 500);

const {
  error,
  data: endpoint,
  refresh: endpointRefresh,
} = await useFetch(`/api/sushi-endpoints/${params.id}`);

const {
  status,
  data: sushis,
  refresh: sushisRefresh,
} = await useFetch('/api/sushi', {
  lazy: true,
  params: {
    endpointId: params.id,
    q: debouncedSearch,
    connection: computed(() => filters.value.connection),
    active: computed(() => filters.value.active),
    archived: computed(() => filters.value.archived),
    include: ['harvests', 'institution'],
    sort: 'institution.name',
    order: 'asc',
    size: 0,
  },
});

const headers = computed(() => [
  {
    title: t('institutions.sushi.packages'),
    value: 'packages',
    align: 'end',
  },
  {
    title: t('status'),
    value: 'connection',
    width: '160px',
    align: 'center',
  },
  {
    title: t('institutions.sushi.harvest'),
    value: 'harvests',
    align: 'center',
    width: '230px',
  },
  {
    title: t('institutions.sushi.updatedAt'),
    value: 'updatedAt',
    width: '230px',
  },
  {
    title: t('status'),
    value: 'status',
    align: 'center',
    width: '130px',
  },
  {
    title: t('actions'),
    value: 'actions',
    align: 'center',
    width: '130px',
  },
]);

const institutionsMap = computed(() => new Map(
  sushis.value?.map((s) => [s.institution.id, s.institution]),
));

const institutionsSelectionStatus = computed(() => {
  if (selectedInstitutions.value.length === 0) {
    return 'empty';
  }
  if (selectedInstitutions.value.length === institutionsMap.value.size) {
    return 'full';
  }
  return 'partial';
});

const registryUrl = computed(() => {
  if (!endpoint.value.registryId) {
    return undefined;
  }

  return new URL(`/platform/${endpoint.value.registryId}`, counterRegistryUrl);
});

function shouldGreyRow(item) {
  return item.deletedAt || item.archived || !item.active;
}

function calcSushiMetrics() {
  if (!sushis.value) {
    sushiMetrics.value = undefined;
    return;
  }

  const value = Object.fromEntries(
    Object.entries(
      Object.groupBy(sushis.value, (s) => s.connection?.status ?? 'untested') || {},
    ).map(([k, s]) => [k, { total: s.length }]),
  );
  value.institutions = institutionsMap.value.size;

  sushiMetrics.value = value;
}

/**
 * Refresh sushis
 */
const refresh = async () => {
  await Promise.all([endpointRefresh(), sushisRefresh()]);
  if (!search.value) {
    calcSushiMetrics();
  }
};

/**
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(refresh, 250);

function selectInstitution(id) {
  if (!id) {
    selectedInstitutions.value = [...institutionsMap.value.keys()];
    return;
  }
  if (!selectedInstitutions.value.includes(id)) {
    selectedInstitutions.value = [...selectedInstitutions.value, id];
  }
}

function unselectInstitution(id) {
  if (!id) {
    selectedInstitutions.value = [];
    return;
  }
  if (selectedInstitutions.value.includes(id)) {
    selectedInstitutions.value = selectedInstitutions.value.filter((i) => i !== id);
  }
}

/**
 * Put sushi ID into clipboard
 *
 * @param {object} param0 Sushi
 */
async function copySushiId({ id }) {
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

/**
 * Toggle active states for endpoint
 */
async function toggleActiveStates() {
  loading.value = true;
  try {
    const active = !endpoint.value.active;
    await $fetch(`/api/sushi-endpoints/${endpoint.value.id}`, {
      method: 'PATCH',
      body: { active },
    });

    endpointRefresh();
  } catch (err) {
    snacks.error(t('endpoints.unableToUpdate'), err);
  }
  loading.value = false;
}

async function copyMailListOfInstitutions(ids) {
  const toCopy = ids || selectedInstitutions.value;
  if (toCopy.length <= 0) {
    return;
  }

  emailsCopyDialogRef.value.open(toCopy);
}

/**
 * Check connections for selected sushi
 *
 * @param {any[]} items Sushi to check, defaults to selected
 */
function checkConnections(items) {
  if (items.length <= 0) {
    return;
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const item of items) {
    addToCheck({ ...item, endpoint: endpoint.value }, {
      onComplete: (err, connection) => {
        if (connection) {
          item.connection = connection;
          debouncedRefresh();
        }
      },
    });
  }
}

function checkConnectionsOfInstitutions() {
  if (selectedInstitutions.value.length <= 0) {
    return;
  }

  const ids = new Set(selectedInstitutions.value);
  const items = sushis.value.filter((s) => ids.has(s.institution.id));
  checkConnections(items);
}

/**
 * Reset connections for selected sushi
 *
 * @param {any[]} items Sushi to reset, defaults to selected
 */
async function resetConnections(items) {
  const toReset = items.filter((item) => !!item?.connection?.status);

  openConfirm({
    title: t('areYouSure'),
    text: t(
      'institutions.sushi.resetNbChecks',
      toReset.length,
    ),
    agreeText: t('reset'),
    agreeIcon: 'mdi-restore',
    onAgree: async () => {
      await Promise.all(
        toReset.map(
          (item) => $fetch(`/api/sushi/${item.id}/connection`, { method: 'DELETE' })
            .catch((err) => {
              snacks.error(t('institutions.sushi.cannotResetCheck', { id: item.endpoint?.vendor || item.id }), err);
              return null;
            }),
        ),
      );

      await refresh();
    },
  });
}

async function resetConnectionsOfInstitutions() {
  if (selectedInstitutions.value.length <= 0) {
    return;
  }

  const ids = new Set(selectedInstitutions.value);
  const items = sushis.value.filter((s) => ids.has(s.institution.id));
  await resetConnections(items);
}

// Map to keep track of groups in v-datatable
const vDataTableGroups = new Map();
/**
 * Register group of v-datatable
 *
 * @see https://github.com/vuetifyjs/vuetify/issues/17707
 *
 * @param {Object} item Vuetify group
 * @param {Function} isGroupOpen Function to check if group is open (provided by Vuetify)
 * @param {Function} toggleGroup Function to open group (provided by Vuetify)
 */
function registerGroup(item, isGroupOpen, toggleGroup) {
  if (vDataTableGroups.has(item.id)) {
    return;
  }

  vDataTableGroups.set(item.id, {
    item,
    get isOpened() { return isGroupOpen(item); },
    toggleGroup: () => toggleGroup(item),
  });
}

/**
 * Toggle all v-datatable group state
 *
 * @param state The state to set
 */
function toggleAllGroups(state) {
  // eslint-disable-next-line no-restricted-syntax
  for (const group of vDataTableGroups.values()) {
    if (group.isOpened !== state) {
      try {
        group.toggleGroup();
      } catch (e) {
        console.error('Unable to open group', group.item, e);
      }
    }
  }
}

watchOnce(
  sushis,
  (v) => {
    calcSushiMetrics();

    const harvests = v
      .flatMap((s) => s.harvests || [])
      .sort((a, b) => a.period.localeCompare(b.period));

    const lastYear = harvests.at(-1)?.period?.replace(/(-[0-9]{2})*$/, '');
    if (lastYear) {
      currentHarvestYear.value = Number.parseInt(lastYear, 10);
    }
  },
);

watchOnce(
  () => status.value === 'success',
  async () => {
    await nextTick();
    toggleAllGroups(true);
  },
);
</script>
