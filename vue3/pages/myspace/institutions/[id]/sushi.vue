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

      <template #filters-panel="props">
        <SushiFilters v-bind="props" />
      </template>

      <v-btn
        v-if="sushiFormRef"
        :text="$t('add')"
        :disabled="!canEdit"
        prepend-icon="mdi-plus"
        variant="tonal"
        color="green"
        class="mr-2"
        @click="sushiFormRef.open(undefined, { institution })"
      />
    </SkeletonPageBar>

    <v-container fluid>
      <v-row>
        <v-col>
          <p>{{ $t('institutions.sushi.pageDescription') }}</p>
          <p class="font-weight-bold">
            {{ $t('institutions.sushi.pageDescription2') }}
          </p>
        </v-col>
      </v-row>

      <v-row v-if="isLocked">
        <v-col>
          <v-alert
            :title="$t('sushi.managementIsLocked')"
            :text="lockStatus?.reason ? $t('reason', { reason: lockStatus?.reason }) : undefined"
            type="info"
            icon="mdi-lock"
            variant="outlined"
            prominent
          />
        </v-col>
      </v-row>

      <v-row v-if="sushiMetrics?.statuses" class="justify-space-evenly">
        <v-col cols="2">
          <SushiMetric
            :model-value="sushiMetrics.statuses.success"
            title-key="sushi.nOperationalCredentials"
            icon="mdi-check"
            color="success"
          />
        </v-col>

        <v-col cols="2">
          <SushiMetric
            :model-value="sushiMetrics.statuses.untested"
            :action-text="$t('show')"
            title-key="sushi.nUntestedCredentials"
            icon="mdi-bell-alert"
            color="info"
            @click="query.connection = 'untested'; refresh()"
          />
        </v-col>

        <v-col cols="2">
          <SushiMetric
            :model-value="sushiMetrics.statuses.unauthorized"
            :action-text="$t('show')"
            title-key="sushi.nInvalidCredentials"
            icon="mdi-key-alert-outline"
            color="warning"
            @click="query.connection = 'unauthorized'; refresh()"
          />
        </v-col>

        <v-col cols="2">
          <SushiMetric
            :model-value="sushiMetrics.statuses.failed"
            :action-text="$t('show')"
            title-key="sushi.nProblematicEndpoints"
            icon="mdi-alert-circle"
            color="error"
            @click="query.connection = 'faulty'; refresh()"
          />
        </v-col>
      </v-row>
    </v-container>

    <v-data-table-server
      v-model="selectedSushi"
      :headers="headers"
      density="comfortable"
      show-select
      show-expand
      single-expand
      return-object
      v-bind="vDataTableOptions"
      class="mt-4"
    >
      <template #top>
        <div class="d-flex px-4 mb-2">
          <v-chip
            :text="sushiReadyLabels.status.text"
            :color="sushiReadyLabels.status.color"
            size="small"
            variant="outlined"
          >
            <template v-if="!!sushiReadyLabels.status.icon" #prepend>
              <v-icon :icon="sushiReadyLabels.status.icon" start />
            </template>
          </v-chip>

          <v-spacer />

          <ConfirmPopover
            v-if="canEdit"
            :title="sushiReadyLabels.confirm.title"
            :text="sushiReadyLabels.confirm.text"
            :agree-icon="sushiReadyLabels.confirm.ok.icon"
            :agree-text="sushiReadyLabels.confirm.ok.text"
            :agree="() => toggleSushiReady()"
            :disagree-text="$t('close')"
            width="500"
          >
            <template #activator="{ props: confirm }">
              <v-btn
                :text="sushiReadyLabels.button.text"
                :color="sushiReadyLabels.button.color"
                append-icon="mdi-chevron-down"
                size="small"
                variant="flat"
                v-bind="confirm"
              />
            </template>
          </ConfirmPopover>
        </div>
      </template>

      <template #[`item.endpoint.vendor`]="{ item }">
        <div>
          <nuxt-link v-if="user?.isAdmin" :to="`/admin/endpoints/${item.endpoint.id}`">
            {{ item.endpoint.vendor }}
          </nuxt-link>
          <span v-else>{{ item.endpoint.vendor }}</span>
        </div>

        <div v-if="!item.endpoint.active" class="d-flex align-center text-caption warning--text">
          <v-icon
            icon="mdi-api-off"
            color="warning"
            class="mr-1"
          />

          {{ $t('endpoints.inactiveDescription') }}
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
          :sushi="item"
          :disabled="isLocked"
          @update:model-value="item.connection = $event; debouncedRefresh()"
        />
      </template>

      <template #[`item.harvests`]="{ item }">
        <SushiHarvestStateChip
          v-if="item.harvests?.length > 0"
          :model-value="item.harvests"
          @click:harvest="harvestMatrix?.open(item, { period: $event.period })"
        />
      </template>

      <template #[`item.updatedAt`]="{ item }">
        <LocalDate :model-value="item.updatedAt" />
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
              v-if="sushiFormRef"
              :title="$t('modify')"
              :disabled="!canEdit"
              prepend-icon="mdi-pencil"
              @click="sushiFormRef?.open(item, { institution })"
            />
            <v-list-item
              v-if="sushiFormRef"
              :title="$t('duplicate')"
              :disabled="!canEdit"
              prepend-icon="mdi-content-copy"
              @click="sushiFormRef?.open({ ...item, id: null }, { institution })"
            />
            <v-list-item
              :title="$t('delete')"
              :disabled="!canEdit"
              prepend-icon="mdi-delete"
              @click="deleteSushis([item])"
            />

            <v-divider />

            <v-list-item
              :title="$t('institutions.sushi.checkCredentials')"
              prepend-icon="mdi-connection"
              @click="checkConnections([item])"
            />
            <v-list-item
              v-if="user?.isAdmin"
              :title="$t('institutions.sushi.resetChecks')"
              prepend-icon="mdi-restore"
              @click="resetConnections([item])"
            />
            <v-list-item
              v-if="harvestMatrix"
              :title="$t('sushi.harvestState')"
              prepend-icon="mdi-table-headers-eye"
              @click="harvestMatrix?.open(item)"
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
            <SushiDetails :model-value="item" />
          </td>
        </tr>
      </template>
    </v-data-table-server>

    <SelectionMenu
      v-model="selectedSushi"
      :text="$t('institutions.sushi.manageN', selectedSushi.length)"
    >
      <template #actions>
        <v-list-item
          :title="$t('delete')"
          :disabled="!canEdit"
          prepend-icon="mdi-delete"
          @click="deleteSushis()"
        />

        <v-divider />

        <v-list-item
          :title="$t('institutions.sushi.activeSwitch')"
          :disabled="!canEdit"
          prepend-icon="mdi-toggle-switch"
          @click="toggleActiveStates()"
        />
        <v-list-item
          :title="$t('institutions.sushi.checkCredentials')"
          prepend-icon="mdi-connection"
          @click="checkConnections()"
        />
        <v-list-item
          v-if="user?.isAdmin"
          :title="$t('institutions.sushi.resetChecks')"
          prepend-icon="mdi-restore"
          @click="resetConnections()"
        />
      </template>
    </SelectionMenu>

    <SushiFormDialog
      ref="sushiFormRef"
      @submit="refresh()"
      @update:model-value="onSushiUpdate($event)"
    />

    <SushiHarvestMatrixDialog ref="harvestMatrix" />

    <SushiHarvestFilesDialog v-if="user?.isAdmin" ref="filesRef" />

    <SushiHarvestHistoryDialog v-if="user?.isAdmin" ref="historyRef" />

    <SushiReportsDialog ref="reportsRef" />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'space',
  middleware: ['auth', 'terms'],
  alias: ['/admin/institutions/:id/sushi'],
});

const { params } = useRoute();
const { data: user } = useAuthState();
const { t, locale } = useI18n();
const { isSupported: clipboard, copy } = useClipboard();
const { openConfirm } = useDialogStore();
const { addToCheck } = useSushiCheckQueueStore();
const snacks = useSnacksStore();

const selectedSushi = ref([]);
const activeLoadingMap = ref(new Map());

/** @type {Ref<Object | null>} Vue ref of the sushi form */
const sushiFormRef = ref(null);
/** @type {Ref<Object | null>} Vue ref of the harvest state */
const harvestMatrix = ref(null);
/** @type {Ref<Object | null>} Vue ref of the report list */
const reportsRef = ref(null);
/** @type {Ref<Object | null>} Vue ref of the file list */
const filesRef = ref(null);
/** @type {Ref<Object | null>} Vue ref of the task history */
const historyRef = ref(null);

const {
  error,
  data: institution,
  refresh: institutionRefresh,
} = await useFetch(`/api/institutions/${params.id}`);

const {
  data: lockStatus,
} = await useFetch('/api/sushi/_lock');

const {
  refresh: sushisRefresh,
  itemLength,
  query,
  data: sushis,
  vDataTableOptions,
} = await useServerSidePagination({
  fetch: {
    url: `/api/institutions/${params.id}/sushi`,
  },
  async: {
    lazy: true, // Don't block page load
  },
  data: {
    sortBy: [{ key: 'endpoint.vendor', order: 'asc' }],
    include: ['endpoint', 'harvests'],
  },
});

const {
  data: sushiMetrics,
  refresh: sushiMetricsRefresh,
} = await useFetch(`/api/institutions/${params.id}/sushi/_metrics`);

/**
 * If sushi edition is locked
 */
const isLocked = computed(() => {
  if (user.value?.isAdmin) {
    return false;
  }
  return lockStatus.value?.locked;
});
/**
 * If user can edit members
 */
const canEdit = computed(() => {
  if (user.value?.isAdmin) {
    return true;
  }
  return !isLocked.value && hasPermission('sushi:write', { throwOnNoMembership: true });
});
/**
 * Table headers
 */
const headers = computed(() => [
  {
    title: t('institutions.sushi.endpoint'),
    value: 'endpoint.vendor',
    sortable: true,
  },
  {
    title: t('institutions.sushi.packages'),
    value: 'packages',
    sortable: true,
    align: 'end',
  },
  {
    title: t('status'),
    value: 'connection',
    width: '160px',
    sortable: true,
    align: 'center',
  },
  {
    title: t('institutions.sushi.lastHarvest'),
    value: 'harvests',
    align: 'center',
  },
  {
    title: t('institutions.sushi.updatedAt'),
    value: 'updatedAt',
    width: '230px',
    sortable: true,
  },
  {
    title: t('status'),
    value: 'active',
    align: 'center',
    width: '130px',
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
  return t('institutions.sushi.title', { count: count ?? '?' });
});
/**
 * Sushi ready formatted date
 */
const sushiReadySince = useDateFormat(institution.value?.sushiReadySince, 'P');
/**
 * Sushi ready labels
 */
const sushiReadyLabels = computed(() => {
  if (institution.value?.sushiReadySince) {
    // Is ready
    return {
      status: {
        icon: 'mdi-checkbox-marked-circle-outline',
        color: 'success',
        text: t('institutions.sushi.entryCompletedOn', { date: sushiReadySince.value }),
      },
      button: {
        color: 'secondary',
        text: t('institutions.sushi.resumeMyEntry'),
      },
      confirm: {
        title: t('institutions.sushi.resumeMyEntry'),
        text: t('institutions.sushi.readyPopup.completed', { date: sushiReadySince.value }),
        ok: {
          icon: 'mdi-text-box-edit-outline',
          text: t('institutions.sushi.resumeMyEntry'),
        },
      },
    };
  }
  // Is not ready
  return {
    status: {
      text: t('institutions.sushi.entryInProgress'),
    },
    button: {
      color: 'primary',
      text: t('institutions.sushi.validateMyCredentials'),
    },
    confirm: {
      title: t('institutions.sushi.validateMyCredentials'),
      text: t('institutions.sushi.readyPopup.inProgress'),
      ok: {
        icon: 'mdi-text-box-check-outline',
        text: t('institutions.sushi.validateMyCredentials'),
      },
    },
  };
});

/**
 * Refresh sushis
 */
const refresh = () => Promise.all([sushisRefresh(), sushiMetricsRefresh()]);

/**
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(refresh, 250);

function onSushiUpdate(item) {
  const index = sushis.value.findIndex((sushi) => sushi.id === item.id);
  if (index < 0) {
    return;
  }

  sushis.value[index] = item;
}

/**
 * Toggle sushi ready status
 */
async function toggleSushiReady() {
  if (!institution.value) {
    return Promise.reject();
  }

  const value = institution.value.sushiReadySince ? null : new Date();
  try {
    await $fetch(`/api/institutions/${institution.value.id}/sushiReadySince`, {
      method: 'PUT',
      body: { value },
    });
    return institutionRefresh();
  } catch (e) {
    snacks.error(t('errors.generic'));
  }
  return Promise.resolve();
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
  } catch (e) {
    snacks.error(t('clipboard.unableToCopy'));
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}

/**
 * Check connections for selected sushi
 *
 * @param {any[]} items Sushi to check, defaults to selected
 */
function checkConnections(items) {
  const toCheck = items || selectedSushi.value;
  if (toCheck.length <= 0) {
    return;
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const item of toCheck) {
    addToCheck(item, {
      onComplete: (err, connection) => {
        if (connection) {
          item.connection = connection;
          debouncedRefresh();
        }
      },
    });
  }

  if (!items) {
    selectedSushi.value = [];
  }
}

/**
 * Toggle active states for selected sushi
 *
 * @param {any[]} items Sushi to toggle, defaults to selected
 */
async function toggleActiveStates(items) {
  const toToggle = items || selectedSushi.value;
  if (toToggle.length <= 0) {
    return;
  }

  await Promise.all(
    toToggle.map(async (item) => {
      activeLoadingMap.value.set(item.id, true);
      try {
        const active = !item.active;
        // eslint-disable-next-line no-await-in-loop
        await $fetch(`/api/sushi/${item.id}`, {
          method: 'PATCH',
          body: { active },
        });

        // eslint-disable-next-line no-param-reassign
        item.active = active;
        activeLoadingMap.value.set(item.id, false);
        return item;
      } catch (e) {
        snacks.error(t('sushi.unableToUpdate'));
        activeLoadingMap.value.set(item.id, false);
        return null;
      }
    }),
  );

  if (!items) {
    selectedSushi.value = [];
  }
}

/**
 * Reset connections for selected sushi
 *
 * @param {any[]} items Sushi to reset, defaults to selected
 */
async function resetConnections(items) {
  let toReset = items || selectedSushi.value;
  if (toReset.length <= 0) {
    return;
  }

  toReset = toReset.filter((item) => !!item?.connection?.status);
  // No reset needed, simulate like we just did
  if (!items && toReset.length <= 0) {
    selectedSushi.value = [];
    return;
  }

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
          } catch (e) {
            snacks.error(t('institutions.sushi.cannotResetCheck', { id: item.endpoint?.vendor || item.id }));
            return Promise.resolve(null);
          }
        }),
      );

      if (!items) {
        selectedSushi.value = [];
      }

      await refresh();
    },
  });
}

/**
 * Delete selected sushi
 *
 * @param {any[]} items Sushi to delete, defaults to selected
 */
async function deleteSushis(items) {
  const toDelete = items || selectedSushi.value;
  if (toDelete.length <= 0) {
    return;
  }

  openConfirm({
    title: t('areYouSure'),
    text: t(
      'sushi.deleteNbCredentials',
      toDelete.length,
    ),
    agreeText: t('delete'),
    agreeIcon: 'mdi-delete',
    onAgree: async () => {
      const results = await Promise.all(
        toDelete.map((item) => {
          try {
            return $fetch(`/api/sushi/${item.id}`, { method: 'DELETE' });
          } catch (e) {
            snacks.error(t('cannotDeleteItems', { id: item.name || item.id }));
            return Promise.resolve(null);
          }
        }),
      );

      if (!results.some((r) => !r)) {
        snacks.success(t('itemsDeleted', { count: toDelete.length }));
      }

      if (!items) {
        selectedSushi.value = [];
      }

      await refresh();
    },
  });
}
</script>
