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
        <SushiFilters v-bind="props" />
      </template>

      <v-switch
        v-tooltip:left="$t(`endpoints.${endpoint.active ? 'activeSince' : 'inactiveSince'}`, { date: dateFormat(endpoint.activeUpdatedAt, locale) })"
        :model-value="endpoint.active"
        :label="endpoint.active ? $t('endpoints.active') : $t('endpoints.inactive')"
        :loading="loading"
        density="compact"
        color="primary"
        hide-details
        class="mt-0 mr-4"
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
        class="mr-4"
        @click="endpointFormDialogRef.open(endpoint)"
      />
    </SkeletonPageBar>

    <v-container fluid>
      <v-row>
        <v-col cols="6">
          <template v-if="!sushiMetrics">
            <v-skeleton-loader
              height="100"
              type="avatar, paragraph"
            />
          </template>

          <template v-else-if="sushiMetrics.failed > 0">
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
          </template>
        </v-col>

        <v-col v-if="!endpoint.active" cols="6">
          <v-alert
            :title="$t('endpoints.inactive')"
            :text="$t('endpoints.inactiveDescription')"
            type="warning"
            prominent
          />
        </v-col>
      </v-row>

      <v-row class="justify-space-evenly">
        <template v-if="!sushiMetrics">
          <v-col v-for="n in 4" :key="n" cols="2">
            <v-skeleton-loader
              height="100"
              type="paragraph"
            />
          </v-col>
        </template>

        <template v-else>
          <v-col cols="2">
            <SimpleMetric
              :text="$t('sushi.nInstitutions', sushiMetrics.institutions)"
              icon="mdi-domain"
            />
          </v-col>

          <v-col cols="2">
            <SushiMetric
              :model-value="sushiMetrics.success || 0"
              title-key="sushi.nOperationalCredentials"
              icon="mdi-check"
              color="success"
            />
          </v-col>

          <v-col cols="2">
            <SushiMetric
              :model-value="sushiMetrics.untested || 0"
              :action-text="$t('show')"
              title-key="sushi.nUntestedCredentials"
              icon="mdi-bell-alert"
              color="info"
              @click="filters.connection = 'untested'"
            />
          </v-col>

          <v-col cols="2">
            <SushiMetric
              :model-value="sushiMetrics.unauthorized || 0"
              :action-text="$t('show')"
              title-key="sushi.nInvalidCredentials"
              icon="mdi-key-alert-outline"
              color="warning"
              @click="filters.connection = 'unauthorized'"
            />
          </v-col>
        </template>
      </v-row>
    </v-container>

    <v-data-table
      :items="sushis ?? []"
      :headers="headers"
      :group-by="[{ key: 'institution.id' }]"
      :loading="status === 'pending' && 'primary'"
      :row-props="({ item }) => ({ class: !item.active && 'bg-grey-lighten-4 text-grey' })"
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
          @click:harvest="harvestMatrixRef?.open(item, { period: $event.period })"
        />
      </template>

      <template #[`item.updatedAt`]="{ item }">
        <LocalDate :model-value="item.updatedAt" />
      </template>

      <template #[`item.active`]="{ item }">
        <span
          v-tooltip:left="$t(`endpoints.${item.active ? 'activeSince' : 'inactiveSince'}`, { date: dateFormat(item.activeUpdatedAt, locale) })"
          :class="[`text-${item.active ? 'green' : 'red-lighten-3'}`]"
        >
          {{ item.active ? $t('endpoints.active') : $t('endpoints.inactive') }}
        </span>
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
              @click="harvestMatrixRef?.open(item)"
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
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: ['sidebase-auth', 'terms', 'admin'],
});

const { params } = useRoute();
const { t, locale } = useI18n();
const { addToCheck } = useSushiCheckQueueStore();
const { isSupported: clipboard, copy } = useClipboard();
const { openConfirm } = useDialogStore();
const snacks = useSnacksStore();

const search = ref('');
const filters = ref({});
const sushiMetrics = ref(undefined);
const loading = ref(false);
const selectedInstitutions = ref([]);

const endpointFormDialogRef = useTemplateRef('endpointFormDialogRef');
const harvestMatrixRef = useTemplateRef('harvestMatrixRef');
const reportsRef = useTemplateRef('reportsRef');
const filesRef = useTemplateRef('filesRef');
const historyRef = useTemplateRef('historyRef');

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
    include: ['harvests', 'institution.memberships.user'],
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
    title: t('institutions.sushi.lastHarvest'),
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
    value: 'active',
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

function calcSushiMetrics() {
  if (!sushis.value) {
    sushiMetrics.value = undefined;
    return;
  }

  const value = Object.fromEntries(
    Object.entries(
      Object.groupBy(sushis.value, (s) => s.connection?.status ?? 'untested') || {},
    ).map(([k, s]) => [k, s.length]),
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
  } catch {
    snacks.error(t('clipboard.unableToCopy'));
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
    // eslint-disable-next-line no-await-in-loop
    await $fetch(`/api/sushi-endpoints/${endpoint.value.id}`, {
      method: 'PATCH',
      body: { active },
    });

    endpointRefresh();
  } catch {
    snacks.error(t('endpoints.unableToUpdate'));
  }
  loading.value = false;
}

async function copyMailListOfInstitutions(ids) {
  const toCopy = ids || selectedInstitutions.value;
  if (toCopy.length <= 0) {
    return;
  }

  const addresses = selectedInstitutions.value.flatMap(
    (id) => {
      const institution = institutionsMap.value.get(id);
      if (!institution) {
        return undefined;
      }
      return institution.memberships
        .filter((m) => m.roles?.some((r) => /^contact:/i.test(r)) || false)
        .map((m) => m.user.email);
    },
  ).filter((v) => !!v);

  try {
    await copy(addresses.join('; '));
  } catch {
    snacks.error(t('clipboard.unableToCopy'));
    return;
  }
  snacks.info(t('emailsCopied'));
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
        toReset.map((item) => {
          try {
            return $fetch(`/api/sushi/${item.id}/connection`, { method: 'DELETE' });
          } catch {
            snacks.error(t('institutions.sushi.cannotResetCheck', { id: item.endpoint?.vendor || item.id }));
            return Promise.resolve(null);
          }
        }),
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

// const groupsOpenedByDefault = new Map();
// /**
//  * Open group by default, Vuetify doesn't provide ways to toggle groups from outside
//  *
//  * @see https://github.com/vuetifyjs/vuetify/issues/17707
//  *
//  * @param {Object} item Vuetify group
//  * @param {Function} isGroupOpen Function to check if group is open (provided by Vuetify)
//  * @param {Function} toggleGroup Function to open group (provided by Vuetify)
//  */
// function openByDefault(item, isGroupOpen, toggleGroup) {
//   if (status.value === 'success' && !isGroupOpen(item) && !groupsOpenedByDefault.has(item.id)) {
//     toggleGroup(item);
//     groupsOpenedByDefault.set(item.id, true);
//   }
// }

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
  () => calcSushiMetrics(),
);

watchOnce(
  () => status.value === 'success',
  async () => {
    await nextTick();
    toggleAllGroups(true);
  },
);
</script>
