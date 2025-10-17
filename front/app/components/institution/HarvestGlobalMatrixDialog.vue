<template>
  <v-dialog
    v-model="isOpen"
    fullscreen
  >
    <v-card
      :title="cardTitle"
      :subtitle="institution.name"
      :loading="status === 'pending' && 'primary'"
      prepend-icon="mdi-table-headers-eye"
      max-height="100vh"
    >
      <template #append>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="isOpen = falase"
        />
      </template>

      <v-card-text class="pa-0" style="max-height: 100%; overflow-y: hidden;">
        <SushiHarvestGlobalMatrix
          v-model:period="period"
          :model-value="data?.matrix"
          :loading="status === 'pending'"
          :max="MAX_HARVEST_MONTH"
          column-key=""
          column-value=""
          class="matrix"
        >
          <template #top>
            <v-alert
              v-if="error"
              :text="getErrorMessage(error)"
              type="error"
            />

            <v-row v-else>
              <v-col>
                <p>
                  {{ $t('sushi.globalHarvestState.institution.description') }}
                </p>
              </v-col>

              <v-col cols="4">
                <div v-if="status === 'pending'" class="d-flex justify-center align-center h-100">
                  <v-progress-circular size="64" color="accent" indeterminate />
                </div>

                <template v-else>
                  <ProgressLinearStack
                    :model-value="bars"
                    height="8"
                  />

                  <v-table height="150" density="comfortable">
                    <tbody>
                      <tr v-for="row in table" :key="row.key">
                        <td>
                          <v-icon
                            v-if="row.header.icon"
                            :icon="row.header.icon"
                            :color="row.header.color"
                            start
                          />

                          {{ row.header.text }}

                          <v-icon
                            v-if="row.header.tooltip"
                            v-tooltip:top="row.header.tooltip"
                            icon="mdi-information-outline"
                            size="x-small"
                            color="info"
                            end
                            style="vertical-align: baseline;"
                          />
                        </td>

                        <td>{{ row.valueStr }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </template>
              </v-col>
            </v-row>
          </template>

          <template #row-header="{ item }">
            <nuxt-link v-if="user.isAdmin" :to="`/admin/endpoints/${item.id}`">
              {{ item.vendor }}
            </nuxt-link>
            <span v-else>
              {{ item.vendor }}
            </span>
          </template>
        </SushiHarvestGlobalMatrix>
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

const NOW = new Date();
const MAX_HARVEST_MONTH = format(NOW, 'yyyy-MM');

const props = defineProps({
  institution: {
    type: Object,
    required: true,
  },
});

const { data: user } = useAuthState();
const { t, te, locale } = useI18n();

const isOpen = shallowRef(false);
const period = ref(getQuarterPeriod(NOW, -1));

const {
  data,
  status,
  error,
  refresh,
} = useFetch(`/api/institutions/${props.institution.id}/sushi/_matrix`, {
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

const cardTitle = computed(() => {
  const title = t('sushi.globalHarvestState.institution.title');
  if (!user.value.isAdmin) {
    return title;
  }

  return `${title} - ${t('institutions.title')}`;
});

const total = computed(() => {
  if (!data.value) {
    return 0;
  }

  return Object.values(data.value.statusCounts).reduce((acc, count) => acc + count, 0);
});

const bars = computed(
  () => Object.entries(data.value?.statusCounts ?? {})
    .map(([name, value]) => {
      let type;
      if (name === 'delayed') {
        type = 'buffer';
      }
      if (name === 'waiting') {
        type = 'stream';
      }

      return {
        key: name,
        type,
        color: harvestStatus.get(name)?.color,
        value: value / total.value,
      };
    })
    .filter(({ value }) => value > 0)
    .sort((a, b) => b.value - a.value),
);

const table = computed(() => {
  const formatter = new Intl.NumberFormat(locale.value, { style: 'percent' });

  return Object.entries(data.value?.statusCounts ?? {})
    .map(([name, value]) => ({
      key: name,
      header: {
        ...harvestStatus.get(name),
        text: te(`tasks.status.${name}`) ? t(`tasks.status.${name}`) : name,
        tooltip: te(`tasks.statusDescriptions.${name}`) && t(`tasks.statusDescriptions.${name}`),
      },
      value,
      valueStr: formatter.format(value / total.value),
    }))
    .filter(({ value }) => value > 0)
    .sort((a, b) => b.value - a.value);
});

async function open() {
  isOpen.value = true;
  await refresh();
}

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
