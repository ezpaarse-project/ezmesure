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
        <SushiApiFilters :institution="institution" v-bind="props" />
      </template>

      <v-btn
        v-if="sushiFormRef"
        :text="$t('add')"
        :disabled="!canEdit"
        prepend-icon="mdi-plus"
        variant="tonal"
        color="green"
        class="mr-2"
        @click="openForm()"
      />
    </SkeletonPageBar>

    <v-slide-y-transition>
      <v-banner
        v-if="isLocked"
        color="info"
        icon="mdi-lock"
        :lines="lockStatus?.reason ? 'two' : 'one'"
      >
        <template #text>
          <div class="font-weight-bold">
            {{ $t('sushi.managementIsLocked') }}
          </div>
          <div v-if="lockStatus?.reason">
            {{ $t('reason', { reason: lockStatus?.reason }) }}
          </div>
        </template>
      </v-banner>
    </v-slide-y-transition>

    <v-container fluid>
      <v-row>
        <v-col>
          <p>{{ $t('institutions.sushi.pageDescription') }}</p>
          <p class="font-weight-bold">
            {{ $t('institutions.sushi.pageDescription2') }}
          </p>
        </v-col>
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
        <v-row v-if="sushiMetrics?.statuses">
          <v-col cols="3">
            <SushiMetric
              :model-value="sushiMetrics.statuses.success"
              :title="$t('sushi.operationalCredentials')"
              icon="mdi-check"
              color="success"
            />
          </v-col>

          <v-col cols="3">
            <SushiMetric
              :model-value="sushiMetrics.statuses.untested"
              :title="$t('sushi.untestedCredentials')"
              :action-text="$t('show')"
              icon="mdi-bell-alert"
              color="info"
              @click="query.connection = 'untested'; refresh()"
            />
          </v-col>

          <v-col cols="3">
            <SushiMetric
              :model-value="sushiMetrics.statuses.unauthorized"
              :title="$t('sushi.invalidCredentials')"
              :action-text="$t('show')"
              icon="mdi-key-alert-outline"
              color="warning"
              @click="query.connection = 'unauthorized'; refresh()"
            />
          </v-col>

          <v-col cols="3">
            <SushiMetric
              :model-value="sushiMetrics.statuses.failed"
              :title="$t('sushi.problematicEndpoints', sushiMetrics.statuses.failed)"
              :action-text="$t('show')"
              icon="mdi-alert-circle"
              color="error"
              @click="query.connection = 'failed'; refresh()"
            />
          </v-col>
        </v-row>
      </v-slide-y-transition>

      <v-row>
        <v-col cols="6">
          <v-card
            :title="sushiReadyLabels.card.title"
            :text="sushiReadyLabels.card.text"
            variant="flat"
            :class="['border', 'border-opacity-100', `border-${sushiReadyLabels.button.color}`]"
          >
            <template #actions>
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

              <v-btn
                :text="sushiReadyLabels.button.text"
                :prepend-icon="sushiReadyLabels.button.icon"
                :color="sushiReadyLabels.button.color"
                :loading="sushiReadyLoading"
                size="small"
                variant="flat"
                @click="toggleSushiReady()"
              />
            </template>
          </v-card>
        </v-col>

        <v-col v-if="!harvestableLabels">
          <v-skeleton-loader
            height="100"
            type="avatar, paragraph"
          />
        </v-col>

        <v-slide-x-reverse-transition>
          <v-col v-if="harvestableLabels">
            <v-alert
              :title="harvestableLabels.title"
              :type="harvestableLabels.type"
              :icon="harvestableLabels.icon"
              variant="tonal"
            >
              <template #text>
                {{ harvestableLabels.text }}

                <ul v-if="(sushiMetrics?.harvestable.reasons.length ?? 0) > 0" class="mt-2">
                  <li
                    v-for="reason in sushiMetrics.harvestable.reasons"
                    :key="reason"
                    class="font-weight-bold"
                  >
                    - {{ $t(`sushi.isNotHarvestable.reasons.${reason}`) }}
                  </li>
                </ul>
              </template>
            </v-alert>
          </v-col>
        </v-slide-x-reverse-transition>
      </v-row>
      
      <v-row>
        <v-col>
          <v-btn
            v-if="harvestMatrixRef"
            :text="$t('sushi.globalHarvestState.title')"
            prepend-icon="mdi-table-headers-eye"
            size="small"
            variant="outlined"
            @click="harvestMatrixRef.open()"
          />
        </v-col>
      </v-row>
    </v-container>

    <v-divider />

    <div class="mb-2">
      <v-tabs
        v-model="currentTabId"
        :items="tabs"
        color="primary"
        grow
        @update:model-value="refresh()"
      >
        <template #tab="{ item }">
          <v-tab
            :prepend-icon="item.icon"
            :text="item.text"
            :value="item.value"
          />
        </template>

        <template #item="{ item }">
          <v-tabs-window-item :value="item.value" class="pa-4">
            {{ item.description }}

            <component
              :is="TABS_COMPONENTS[item.value]"
              v-if="TABS_COMPONENTS[item.value]"
              :institution="institution"
              :is-locked="lockStatus?.locked"
              :can-edit="canEdit"
              @mounted="tabsData.set(item.value, $event)"
              @refresh="sushiMetricsRefresh()"
              @[`update:institution.sushiReadySince`]="toggleSushiReady()"
            />
          </v-tabs-window-item>
        </template>
      </v-tabs>
    </div>

    <SushiFormDialog
      ref="sushiFormRef"
      @submit="refresh()"
      @update:model-value="refresh()"
    />

    <InstitutionHarvestGlobalMatrixDialog
      ref="harvestMatrixRef"
      :institution="institution"
    />
  </div>
</template>

<script setup>
import ActiveTable from '@/components/sushi/credentials/ActiveTable.vue';
import ArchivedTable from '@/components/sushi/credentials/ArchivedTable.vue';

definePageMeta({
  layout: 'space',
  middleware: ['sidebase-auth', 'terms'],
  alias: ['/admin/institutions/:id/sushi'],
});

const TABS_COMPONENTS = {
  active: ActiveTable,
  archived: ArchivedTable,
};

const { params } = useRoute();
const { t } = useI18n();
const { data: user } = useAuthState();
const { hasPermission } = useCurrentUserStore();
const { openConfirm } = useDialogStore();
const snacks = useSnacksStore();

const tabsData = ref(new Map());
const currentTabId = shallowRef('');
const sushiReadyLoading = shallowRef(false);

const sushiFormRef = useTemplateRef('sushiFormRef');
const harvestMatrixRef = useTemplateRef('harvestMatrixRef');

const {
  error,
  data: institution,
  refresh: institutionRefresh,
} = await useFetch(`/api/institutions/${params.id}`);

const {
  data: lockStatus,
} = await useFetch('/api/sushi/_lock');

const {
  data: sushiMetrics,
  refresh: sushiMetricsRefresh,
} = await useFetch(`/api/institutions/${params.id}/sushi/_metrics`, {
  lazy: true,
});

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
  return !isLocked.value && hasPermission(params.id, 'sushi:write', { throwOnNoMembership: true });
});
/**
 * Tabs
 */
const tabs = computed(() => [
  {
    text: t('sushi.tabs.active.title'),
    description: t('sushi.tabs.active.description'),
    value: 'active',
    icon: 'mdi-key-wireless',
  },
  {
    text: t('sushi.tabs.archived.title'),
    description: t('sushi.tabs.archived.description'),
    value: 'archived',
    icon: 'mdi-archive',
  },
]);
/**
 * Current tab
 */
const currentTabData = computed(() => tabsData.value.get(currentTabId.value));
/**
 * Current query
 */
const query = computed({
  get: () => currentTabData.value?.query ?? {},
  set: (value) => {
    if (!currentTabData.value) {
      return;
    }
    currentTabData.value.query = value;
  },
});
/**
 * Toolbar title
 */
const toolbarTitle = computed(() => {
  const itemLength = currentTabData.value?.itemLength ?? {};

  let count = itemLength.current != null ? `${itemLength.current}` : null;
  if (itemLength.current !== itemLength.total) {
    count = `${itemLength.current}/${itemLength.total}`;
  }
  return t('institutions.sushi.title', { count: count ?? '?' });
});
/**
 * Sushi ready formatted date
 */
const isSushiReady = computed(() => institution.value?.sushiReadySince || false);
/**
 * Sushi ready formatted date
 */
const sushiReadySince = useDateFormat(() => institution.value?.sushiReadySince, 'P');
/**
 * Sushi ready labels
 */
const sushiReadyLabels = computed(() => {
  if (isSushiReady.value) {
    // Is ready
    return {
      card: {
        title: t('institutions.sushi.resumeMyEntry'),
        text: t('institutions.sushi.readyPopup.completed', { date: sushiReadySince.value }),
      },
      status: {
        icon: 'mdi-checkbox-marked-circle-outline',
        color: 'success',
        text: t('institutions.sushi.entryCompletedOn', { date: sushiReadySince.value }),
      },
      button: {
        color: 'secondary',
        icon: 'mdi-text-box-edit-outline',
        text: t('institutions.sushi.resumeMyEntry'),
      },
    };
  }
  // Is not ready
  return {
    card: {
      title: t('institutions.sushi.validateMyCredentials'),
      text: t('institutions.sushi.readyPopup.inProgress'),
    },
    status: {
      icon: undefined,
      color: undefined,
      text: t('institutions.sushi.entryInProgress'),
    },
    button: {
      color: 'primary',
      icon: 'mdi-text-box-check-outline',
      text: t('institutions.sushi.validateMyCredentials'),
    },
  };
});
/**
 * Harvestable labels
 */
const harvestableLabels = computed(() => {
  if (!sushiMetrics.value) {
    return undefined;
  }

  if (sushiMetrics.value.harvestable.value) {
    return {
      title: t('sushi.isHarvestable.title'),
      text: t('sushi.isHarvestable.text'),
      type: 'success',
      icon: 'mdi-check',
    };
  }

  return {
    title: t('sushi.isNotHarvestable.title'),
    text: t('sushi.isNotHarvestable.text'),
    type: 'warning',
    icon: 'mdi-alert',
  };
});

/**
 * Refresh sushis
 */
const refresh = () => Promise.all([currentTabData.value?.refresh?.(), sushiMetricsRefresh()]);

/**
 * Debounced refresh
 */
const debouncedRefresh = useDebounceFn(refresh, 250);

/**
 * Toggle sushi ready status
 */
async function toggleSushiReady() {
  if (!institution.value) {
    return;
  }

  sushiReadyLoading.value = true;
  const value = institution.value.sushiReadySince ? null : new Date();
  try {
    await $fetch(`/api/institutions/${institution.value.id}/sushiReadySince`, {
      method: 'PUT',
      body: { value },
    });

    await institutionRefresh();
    // fix issue where institution is shown as not ready
    setTimeout(async () => {
      await sushiMetricsRefresh();
    }, 500);
  } catch (err) {
    snacks.error(t('errors.generic'), err);
  }
  sushiReadyLoading.value = false;
}

async function openForm() {
  // Show confirm if already ready
  if (!user.value.isAdmin && isSushiReady.value) {
    const shouldUnready = await openConfirm({
      title: t('institutions.sushi.resumeEntryQuestion'),
      text: t('institutions.sushi.resumeEntryDesc'),
    });

    if (!shouldUnready) {
      return;
    }

    toggleSushiReady();
  }

  sushiFormRef.value.open(undefined, { institution: institution.value });
}
</script>
