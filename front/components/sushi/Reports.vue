<template>
  <v-card
    :title="$t('reports.supportedReportsOnPlatform')"
    :loading="status === 'pending' && 'primary'"
    prepend-icon="mdi-file-search"
  >
    <template v-if="showSushi" #subtitle>
      <SushiSubtitle :model-value="modelValue" />
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

      <v-row>
        <v-col>
          <v-table>
            <thead>
              <tr>
                <th>{{ $t('name') }}</th>
                <th>{{ $t('identifier') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="report in filteredReports"
                :key="report.Report_ID"
              >
                <td>{{ report.Report_Name }}</td>
                <td>{{ report.Report_ID }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-col>
      </v-row>
    </template>

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

const {
  data: reports,
  error,
  refresh,
  status,
} = await useFetch(`/api/sushi/${props.sushi.id}/reports`, {
  lazy: true,
});

const exceptions = computed(() => {
  if (!error.value) {
    return [];
  }

  let rawExceptions = error.value?.data?.exceptions;
  if (!Array.isArray(rawExceptions)) {
    rawExceptions = [{ Message: data?.error }];
  }

  return rawExceptions.map(
    (exception) => {
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
    },
  ).filter((message) => !!message);
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
</script>
