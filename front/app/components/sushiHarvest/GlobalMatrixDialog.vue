<template>
  <v-dialog
    v-model="isOpen"
    fullscreen
  >
    <v-card
      :title="$t('sushi.globalHarvestState.title')"
      :loading="loading && 'primary'"
      prepend-icon="mdi-table-headers-eye"
    >
      <template #append>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="isOpen = false"
        />
      </template>

      <v-card-text class="pa-0" style="max-height: 100%; overflow-y: hidden;">
        <v-tabs v-model="tab" grow>
          <v-tab
            :value="TABS.institutions"
            :text="$t('menu.admin.institutions')"
            prepend-icon="mdi-domain"
          />

          <v-tab
            :value="TABS.endpoints"
            :text="$t('menu.admin.sushiEndpoints')"
            prepend-icon="mdi-api"
          />
        </v-tabs>

        <v-tabs-window v-model="tab" class="h-100">
          <v-tabs-window-item :value="TABS.institutions" class="h-100">
            <SushiHarvestGlobalMatrix
              v-model:period="period"
              :model-value="institutionsData?.matrix"
              :loading="institutionsStatus === 'pending'"
              :max="MAX_HARVEST_MONTH"
              column-key=""
              column-value=""
              class="matrix pb-2"
            >
              <template #top>
                <v-alert
                  v-if="institutionsError"
                  :text="getErrorMessage(institutionsError)"
                  type="error"
                />

                <v-row v-else>
                  <v-col>
                    <p>
                      {{ $t('sushi.globalHarvestState.harvest-session.description') }}
                    </p>
                  </v-col>

                  <v-col cols="4">
                    <div v-if="institutionsStatus === 'pending'" class="d-flex justify-center align-center h-100">
                      <v-progress-circular size="64" color="accent" indeterminate />
                    </div>

                    <template v-else-if="harvestedInstitutionBar">
                      <v-progress-linear
                        :model-value="harvestedInstitutionBar.value"
                        height="8"
                        color="primary"
                        rounded
                      />

                      <v-table height="100" density="comfortable">
                        <tbody>
                          <tr>
                            <td>
                              <v-icon icon="mdi-file-outline" color="primary" start />

                              {{ $t('tasks.status.harvested') }}
                            </td>

                            <td>
                              {{ harvestedInstitutionBar.harvested.percent }}

                              ({{ harvestedInstitutionBar.harvested.count }})
                            </td>
                          </tr>

                          <tr>
                            <td>
                              <v-icon icon="mdi-help" color="primary" start style="opacity: var(--v-border-opacity);" />

                              {{ $t('tasks.status.unharvested') }}
                            </td>

                            <td>
                              {{ harvestedInstitutionBar.unharvested.percent }}

                              ({{ harvestedInstitutionBar.unharvested.count }})
                            </td>
                          </tr>
                        </tbody>
                      </v-table>

                      <v-menu
                        v-if="institutionsData.unharvested.length > 0"
                        height="500"
                        width="600"
                        :close-on-content-click="false"
                      >
                        <template #activator="{ props: menu, isActive }">
                          <v-btn
                            :text="$t('sushi.globalHarvestState.showUnharvested')"
                            :prepend-icon="isActive ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                            color="secondary"
                            block
                            v-bind="menu"
                          />
                        </template>

                        <v-list lines="2" density="compact" slim>
                          <v-list-item
                            v-for="institution in institutionsData.unharvested"
                            :key="institution.id"
                            :title="institution.name"
                            :subtitle="institution.acronym"
                            :to="`/admin/institutions/${institution.id}/sushi`"
                          >
                            <template #prepend>
                              <InstitutionAvatar :institution="institution" />
                            </template>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </template>
                  </v-col>
                </v-row>
              </template>

              <template #row-header="{ item }">
                <nuxt-link :to="`/admin/institutions/${item.id}/sushi`">
                  {{ item.name }}
                </nuxt-link>
              </template>
            </SushiHarvestGlobalMatrix>
          </v-tabs-window-item>

          <v-tabs-window-item :value="TABS.endpoints" class="h-100">
            <SushiHarvestGlobalMatrix
              v-model:period="period"
              :model-value="endpointsData?.matrix"
              :loading="endpointsStatus === 'pending'"
              :max="MAX_HARVEST_MONTH"
              column-key=""
              class="matrix pb-2"
            >
              <template v-if="endpointsError" #top>
                <v-alert
                  :text="getErrorMessage(endpointsError)"
                  type="error"
                />
              </template>

              <template #column-header="{ item }">
                <span class="text-uppercase">{{ item }}</span>
              </template>

              <template #row-header="{ item }">
                <nuxt-link :to="`/admin/endpoints/${item.id}`">
                  {{ item.vendor }}
                </nuxt-link>
              </template>
            </SushiHarvestGlobalMatrix>
          </v-tabs-window-item>
        </v-tabs-window>

        <template #actions>
          <v-btn
            :text="$t('close')"
            variant="text"
            @click="isOpen = false"
          />
        </template>
      </v-card-text>

      <template #actions>
        <v-btn
          :text="$t('close')"
          variant="text"
          @click="isOpen = false"
        />
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { format } from 'date-fns';

import { getQuarterPeriod } from '@/lib/sushi';
import { getErrorMessage } from '@/lib/errors';

const TABS = {
  institutions: 'institutions',
  endpoints: 'endpoints',
};

const NOW = new Date();
const MAX_HARVEST_MONTH = format(NOW, 'yyyy-MM');

const { locale } = useI18n();

const tab = shallowRef(TABS.institutions);
const isOpen = shallowRef(false);
const period = ref(getQuarterPeriod(NOW, -1));

const {
  data: institutionsData,
  status: institutionsStatus,
  error: institutionsError,
  refresh: institutionsRefresh,
} = useFetch('/api/harvests/_institutions-matrix', {
  params: {
    retryCode: 425,
    'period:from': computed(() => period.value.beginDate),
    'period:to': computed(() => period.value.endDate),
  },

  // Try for 1 minute
  retry: 60,
  retryDelay: 1000,
  retryStatusCodes: [425],

  lazy: true,
  immediate: false,
});

const harvestedInstitutionBar = computed(() => {
  if (!institutionsData.value) {
    return undefined;
  }

  const { unharvested, matrix: { rows } } = institutionsData.value;

  const formatter = new Intl.NumberFormat(locale.value, { style: 'percent' });

  const value = rows.length / (unharvested.length + rows.length);

  return {
    value: value * 100,
    harvested: {
      count: rows.length,
      percent: formatter.format(value),
    },
    unharvested: {
      count: unharvested.length,
      percent: formatter.format(1 - value),
    },
  };
});

const {
  data: endpointsData,
  status: endpointsStatus,
  error: endpointsError,
  refresh: endpointsRefresh,
} = useFetch('/api/harvests/_endpoints-matrix', {
  params: {
    retryCode: 425,
    'period:from': computed(() => period.value.beginDate),
    'period:to': computed(() => period.value.endDate),
  },

  // Try for 1 minute
  retry: 60,
  retryDelay: 1000,
  retryStatusCodes: [425],

  lazy: true,
  immediate: false,
});

const loading = computed(() => institutionsStatus.value === 'pending' || endpointsStatus.value === 'pending');

async function refresh() {
  if (tab.value === TABS.institutions) {
    await institutionsRefresh();
  }
  if (tab.value === TABS.endpoints) {
    await endpointsRefresh();
  }
}

async function open() {
  isOpen.value = true;
  await refresh();
}

watch(tab, refresh);

defineExpose({
  open,
});
</script>

<style lang="css" scoped>
.matrix :deep(.matrix--row-header) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
}
</style>
