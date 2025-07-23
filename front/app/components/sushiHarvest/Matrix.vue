<template>
  <v-card
    :title="$t('sushi.harvestState')"
    :loading="status === 'pending' && 'primary'"
    prepend-icon="mdi-table-headers-eye"
  >
    <template v-if="showSushi" #subtitle>
      <SushiSubtitle :model-value="sushi" />
    </template>

    <template #append>
      <v-btn
        :text="$t('refresh')"
        :loading="status === 'pending'"
        prepend-icon="mdi-reload"
        variant="tonal"
        color="primary"
        class="mr-2"
        @click="refresh()"
      />
    </template>

    <template #text>
      <v-row>
        <v-col>
          <p>
            {{ $t('sushi.harvestStateDescription') }}
          </p>
        </v-col>
      </v-row>

      <v-row>
        <v-col class="d-flex justify-center align-center">
          <v-btn
            :disabled="status === 'pending'"
            color="primary"
            variant="text"
            density="comfortable"
            icon="mdi-arrow-left"
            @click="periodAsYear -= 1"
          />

          <span class="text-h4 mx-3">
            {{ periodAsYear }}
          </span>

          <v-btn
            :disabled="status === 'pending' || periodAsYear >= now.getFullYear()"
            color="primary"
            variant="text"
            density="comfortable"
            icon="mdi-arrow-right"
            @click="periodAsYear += 1"
          />
        </v-col>
      </v-row>

      <v-row v-if="(harvests?.length ?? 0) <= 0">
        <v-col class="d-flex justify-center">
          <v-empty-state
            icon="mdi-table-headers-eye-off"
            :title="$t('sushi.noMatrix.title')"
            :text="$t('sushi.noMatrix.description')"
          />
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col>
          <v-table>
            <thead>
              <tr>
                <th>
                  {{ $t('sushi.report') }}
                </th>
                <th v-for="month in periods" :key="month">
                  {{ month }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="[reportId, report] in harvestsByReports"
                :key="reportId"
                :class="{
                  'unsupported-row': !report.supported,
                  'manual-row': report.manual,
                }"
              >
                <td>
                  {{ reportId }}
                </td>

                <template v-if="report.supported">
                  <td v-for="month in periods" :key="`${reportId}-${month}`">
                    <SushiHarvestMatrixCell :model-value="report.harvests.get(month)" />
                  </td>
                </template>

                <template v-else>
                  <td :colspan="periods.length" class="text-center">
                    {{ report.manual ? $t('sushi.matrix.ignored') : $t('sushi.matrix.unsupported') }}
                  </td>
                </template>
              </tr>
            </tbody>
          </v-table>
        </v-col>
      </v-row>
    </template>

    <template v-if="$slots.actions" #actions>
      <v-spacer />
      <slot name="actions" />
    </template>
  </v-card>
</template>

<script setup>
import { parse } from 'date-fns';

import { DEFAULT_REPORTS_IDS, SUPPORTED_COUNTER_VERSIONS } from '@/lib/sushi';

// eslint-disable-next-line vue/max-len
/** * @typedef {{ supported: boolean, manual: boolean, harvests: Map<string, object[]> }} ReportDef */

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => undefined,
  },
  sushi: {
    type: Object,
    default: () => undefined,
  },
  period: {
    type: String,
    default: undefined,
  },
  showSushi: {
    type: Boolean,
    default: false,
  },
});

const now = new Date();

/**
 * Selected period, as a `yyyy-MM` string
 */
const currentPeriod = ref(props.period ?? '');

const periodAsDate = computed(() => (currentPeriod.value ? parse(currentPeriod.value, 'yyyy-MM', now) : now));
const periodAsYear = computed({
  get: () => periodAsDate.value.getFullYear(),
  set: (v) => {
    currentPeriod.value = `${v}-01`;
  },
});
const periods = computed(() => Array.from({ length: 12 }, (_, i) => {
  const month = `${i + 1}`.padStart(2, '0');
  return `${periodAsYear.value}-${month}`;
}));

const {
  data: harvests,
  refresh,
  status,
} = await useFetch(`/api/sushi/${props.sushi?.id}/harvests`, {
  params: {
    include: ['harvestedBy'],
    from: computed(() => periods.value.at(0)),
    to: computed(() => periods.value.at(-1)),
    sort: 'period',
    order: 'asc',
  },
});

const endpointVersions = computed(
  () => props.sushi?.endpoint?.counterVersions ?? Object.keys(SUPPORTED_COUNTER_VERSIONS),
);

const supportedReports = computed(() => {
  const legacySupported = (props.sushi?.endpoint?.supportedReports ?? []).map((r) => [
    r.toUpperCase(),
    {
      supported: true,
      manual: false,
    },
  ]);

  const legacyAdditional = (props.sushi?.endpoint?.additionalReports ?? []).map((r) => [
    r.toUpperCase(),
    {
      supported: true,
      manual: true,
    },
  ]);

  // We don't need first/last month available, so we can merge all versions
  const supported = endpointVersions.value.flatMap(
    (version) => Object.entries(props.endpoint?.supportedData?.[version] ?? {}).map(
      ([r, reportData]) => {
        if (!reportData?.supported?.value) {
          return [];
        }

        return [
          r.toUpperCase(),
          {
            supported: reportData?.supported?.value,
            manual: reportData?.supported?.manual,
          },
        ];
      },
    ),
  );

  return new Map([...legacySupported, ...legacyAdditional, ...supported]);
});

const unsupportedReports = computed(() => {
  const legacy = (props.sushi?.endpoint?.ignoredReports ?? []).map((r) => [
    r.toUpperCase(),
    {
      supported: false,
      manual: false,
    },
  ]);

  // We don't need first/last month available, so we can merge all versions
  const unsupported = endpointVersions.value.flatMap(
    (version) => Object.entries(props.endpoint?.supportedData?.[version] ?? {}).map(
      ([r, reportData]) => {
        if (reportData?.supported?.value === true) {
          return [];
        }
        return [
          r.toUpperCase(),
          {
            supported: reportData?.supported?.value,
            manual: reportData?.supported?.manual,
          },
        ];
      },
    ),
  );

  return new Map([...legacy, ...unsupported]);
});

const harvestsByReports = computed(() => {
  /** @type {Map<string, ReportDef>} */
  const reports = new Map(DEFAULT_REPORTS_IDS.map((reportId) => {
    const supported = supportedReports.value.get(reportId) ?? { supported: false, manual: false };
    return [
      reportId,
      { ...supported, harvests: new Map() },
    ];
  }));

  // eslint-disable-next-line no-restricted-syntax
  for (const harvest of harvests.value) {
    const id = harvest.reportId?.toUpperCase();
    if (id) {
      const acc = reports.get(id) ?? { manual: false, harvests: new Map() };
      acc.supported = true; // Maybe not really supported, but allow to show harvests
      acc.harvests.set(harvest.period, harvest);
      reports.set(id, acc);
    }
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const [reportId, data] of unsupportedReports.value) {
    if (reportId) {
      reports.set(reportId, { ...data, harvests: new Map() });
    }
  }

  return Array.from(reports.entries())
    .sort(([a], [b]) => a.localeCompare(b));
});
</script>

<style lang="css" scoped>
.unsupported-row {
  color: grey;
}
.manual-row {
  color: green;
}
.unsupported-row.manual-row {
  color: red;
}
</style>
