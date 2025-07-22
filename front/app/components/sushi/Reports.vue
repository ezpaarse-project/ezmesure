<template>
  <v-card
    :title="$t('reports.supportedReportsOnPlatform')"
    :loading="status === 'pending' && 'primary'"
    prepend-icon="mdi-file-search"
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

    <v-tabs
      v-if="versions.length > 0"
      v-model="currentVersion"
      bg-color="primary"
      class="px-2"
    >
      <v-tab
        v-for="version in versions"
        :key="version"
        :value="version"
      >
        COUNTER
        <v-badge
          :content="version"
          :color="counterVersionsColors.get(version) || 'secondary'"
          inline
        />
      </v-tab>
    </v-tabs>

    <v-card-text>
      <v-row v-if="exceptions.length > 0">
        <v-col>
          <v-alert
            variant="tonal"
            color="error"
          >
            {{ $t('reports.sushiReturnedErrors') }}

            <ul>
              <li
                v-for="(message, index) in exceptions"
                :key="index"
              >
                {{ message }}
              </li>
            </ul>
          </v-alert>
        </v-col>
      </v-row>

      <v-row v-if="filteredReports.length > 0">
        <v-col>
          <v-table>
            <thead>
              <tr>
                <th>{{ $t('name') }}</th>
                <th>{{ $t('identifier') }}</th>
                <th>
                  <div v-if="currentVersion !== '5'">
                    {{ $t('reports.availablePeriod') }}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="report in filteredReports"
                :key="report.Report_ID"
              >
                <td>{{ report.Report_Name }}</td>
                <td>{{ report.Report_ID }}</td>
                <td>
                  <span v-if="report.First_Month_Available || report.Last_Month_Available">
                    {{ report.First_Month_Available ?? $t('unknown') }}
                    ~
                    {{ report.Last_Month_Available ?? $t('unknown') }}
                  </span>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-col>
      </v-row>

      <v-row v-else-if="status !== 'pending'">
        <v-col>
          <v-empty-state
            icon="mdi-file-hidden"
            :title="$t('reports.failedToFetchReports')"
            :text="$t('reports.supportedReportsUnavailable')"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <template #actions>
      <v-switch
        v-model="showOnlyMaster"
        :label="$t('reports.onlyShowMasterReports')"
        color="primary"
        hide-details
        class="ml-2"
      />

      <v-spacer />

      <slot name="actions" />
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  sushi: {
    type: Object,
    required: true,
  },
  showSushi: {
    type: Boolean,
    default: false,
  },
});

const showOnlyMaster = ref(true);
const currentVersion = ref('5.1');

const { t } = useI18n();

const {
  data: reportsPerVersion,
  error,
  refresh,
  status,
} = await useFetch(`/api/sushi/${props.sushi.id}/reports`, {
  lazy: true,
});

const versions = computed(
  () => Object.keys(reportsPerVersion.value ?? {})
    // Sort from most recent to oldest (6 -> 5.2 -> 5.1 -> 5 -> ...)
    .sort((a, b) => (b > a ? 1 : -1)),
);
const reports = computed(() => reportsPerVersion.value?.[currentVersion.value]?.data ?? []);

const exceptions = computed(() => {
  if (status.value === 'pending') {
    return [];
  }

  const rawExceptions = reportsPerVersion.value?.[currentVersion.value]?.exceptions ?? [];
  if (reportsPerVersion.value?.[currentVersion.value]?.error) {
    rawExceptions.push({ Message: reportsPerVersion.value[currentVersion.value].error });
  }
  if (error.value) {
    rawExceptions.push({ Message: error.value?.data?.error || t('errors.generic') });
  }

  return rawExceptions.map((exception) => {
    if (!exception) {
      return undefined;
    }

    let message = exception.Message;
    if (exception.Code) {
      message = `[#${exception.Code}] ${message}`;
    }
    if (exception.Severity) {
      message = `[${exception.Severity}] ${message}`;
    }
    return message;
  }).filter((message) => !!message);
});

const filteredReports = computed(() => {
  const r = reports.value ?? [];
  if (!showOnlyMaster.value) {
    return r;
  }

  return r.filter((report) => {
    if (typeof report?.Report_ID !== 'string') {
      return false;
    }
    return !report?.Report_ID.includes('_');
  });
});

watchOnce(versions, (values) => { ([currentVersion.value] = values); });
</script>
