<template>
  <v-card
    :title="$t('sushi.harvestState')"
    :loading="status === 'pending' && 'primary'"
    prepend-icon="$mdi-table-headers-eye"
  >
    <template v-if="showSushi" #subtitle>
      <SushiSubtitle :model-value="sushi" />
    </template>

    <template #append>
      <v-btn
        :text="$t('refresh')"
        :loading="status === 'pending'"
        prepend-icon="$mdi-reload"
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
            icon="$mdi-arrow-left"
            @click="periodAsYear -= 1"
          />

          <span class="text-headline-large mx-3">
            {{ periodAsYear }}
          </span>

          <v-btn
            :disabled="status === 'pending' || periodAsYear >= now.getFullYear()"
            color="primary"
            variant="text"
            density="comfortable"
            icon="$mdi-arrow-right"
            @click="periodAsYear += 1"
          />
        </v-col>
      </v-row>

      <v-row v-if="(harvests?.length ?? 0) <= 0">
        <v-col class="d-flex justify-center">
          <v-empty-state
            icon="$mdi-table-headers-eye-off"
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
                <th class="text-end">
                  {{ $t('sushi.matrix.supportedBy') }}
                </th>
                <th>
                  {{ $t('sushi.report') }}
                </th>
                <th v-for="month in periods" :key="month">
                  {{ month }}
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-for="[reportId, report] in harvestsByReports">
                <tr
                  v-if="report.force || report.harvests.size > 0"
                  :key="reportId"
                  :class="{
                    'unsupported-row': report.supported.value.length <= 0,
                    'manual-row': report.supported.manual,
                  }"
                >
                  <td class="text-end">
                    <SushiEndpointVersionsChip :model-value="{ counterVersions: report.supported.value }" size="small" end />
                  </td>
                  <td>
                    {{ reportId }}
                  </td>

                  <template v-if="report.supported.value.length > 0">
                    <td v-for="month in periods" :key="`${reportId}-${month}`">
                      <SushiHarvestMatrixCell :model-value="report.harvests.get(month)" />
                    </td>
                  </template>

                  <td v-else :colspan="periods.length" class="text-center">
                    {{ report.supported.manual ? $t('sushi.matrix.ignored') : $t('sushi.matrix.unsupported') }}
                  </td>
                </tr>
              </template>
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

import { SUPPORTED_COUNTER_VERSIONS } from '@/lib/sushi';

/**
  * @typedef {object} ReportDef
  * @property {Map<string, object[]>} harvests - The harvests grouped by period
  * @property {true} [force] - Should force the display even if empty

  * @property {object} supported - Info about support
  * @property {string[]} supported.value - Releases that supports the report
  * @property {boolean} supported.manual - Is the info was manually set
  */

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

const { data: apiConfig } = await useApiConfig();

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

const harvestsByReports = computed(() => {
  // Init map with reports harvested by API
  /** @type {Map<string, ReportDef>} */
  const reports = new Map(
    apiConfig.value?.counter.defaultHarvestedReports?.map((reportId) => [
      reportId.toUpperCase(),
      {
        harvests: new Map(),
        force: true,
        supported: {
          value: [],
          manual: false,
        },
      },
    ]),
  );

  // Regroup harvests into sub-maps across the map
  // eslint-disable-next-line no-restricted-syntax
  for (const harvest of harvests.value) {
    const id = harvest.reportId.toUpperCase();

    // Get definition (or init one)
    const def = reports.get(id) ?? {
      harvests: new Map(),
      supported: {
        value: [],
        manual: false,
      },
    };

    def.harvests.set(harvest.period, harvest);

    reports.set(id, def);
  }

  // Fille the support data
  const supportedVersions = props.sushi?.endpoint?.counterVersions ?? SUPPORTED_COUNTER_VERSIONS;
  // eslint-disable-next-line no-restricted-syntax
  for (const version of supportedVersions) {
    const data = props.sushi?.endpoint?.supportedData[version] ?? {};

    const reportsOfVersion = new Map([
      ...Object.entries(data),
      // Legacy way to handle supported reports
      ...(props.sushi?.endpoint.supportedReports ?? [])
        .map((report) => [report, { supported: { value: true, manual: false } }]),
      // Legacy way to handle additional reports
      ...(props.sushi?.endpoint.additionalReports ?? [])
        .map((report) => [report, { supported: { value: true, manual: true } }]),
      // Legacy way to handle unsupported reports
      ...(props.sushi?.endpoint.unsupportedReports ?? [])
        .map((report) => [report, { supported: { value: false, manual: true } }]),
    ]);

    // eslint-disable-next-line no-restricted-syntax
    for (const [reportId, reportData] of reportsOfVersion) {
      const id = reportId.toUpperCase();

      // Get definition (or init one)
      const def = reports.get(id) ?? {
        harvests: new Map(),
        supported: {
          value: [],
          manual: false,
        },
      };

      // Update releases that support report
      if (reportData.supported?.value) {
        def.supported.value = [...def.supported.value, version].sort();
      }
      // Update releases that support report
      if (!def.supported.manual) {
        def.supported.manual = reportData.supported.manual;
      }

      reports.set(id, def);
    }
  }

  return Array.from(reports.entries())
    .sort(([a], [b]) => a.localeCompare(b));
});
</script>

<style lang="css" scoped>
.unsupported-row {
  color: grey;

  &.manual-row {
    color: red;
  }
}
</style>
