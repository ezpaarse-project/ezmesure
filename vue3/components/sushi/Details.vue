<template>
  <v-container fluid>
    <v-row>
      <SushiDetailsField
        v-for="field in fields"
        :key="field.label"
        :value="field.value"
        :label="field.label"
        :cols="field.cols"
      />

      <SushiDetailsField
        v-if="modelValue?.params?.length > 0"
        :label="$t('advancedSettings')"
        cols="12"
      >
        <v-tooltip
          v-for="param in modelValue.params"
          :key="param.name"
          position="top"
        >
          <template #activator="{ props: tooltip }">
            <v-chip label class="mr-1" v-bind="tooltip">
              {{ param.name }} = {{ param.value }}
            </v-chip>
          </template>

          {{ $t(`sushi.scope`) }}:
          <b>{{ $t(`sushi.paramScopes.${param.scope}`) }}</b>
        </v-tooltip>
      </SushiDetailsField>

      <SushiDetailsField
        v-if="credentialUrl"
        :label="$t('institutions.sushi.sushiUrl')"
        cols="12"
      >
        <a
          :href="credentialUrl.href"
          target="_blank"
          rel="noreferrer noopener"
        >
          {{ credentialUrl.href }}<v-icon
            icon="mdi-open-in-new"
            color="secondary"
            size="small"
            class="ml-1"
          />
        </a>
      </SushiDetailsField>

      <SushiDetailsField
        v-if="modelValue.comment"
        :value="modelValue.comment"
        :label="$t('institutions.sushi.comment')"
        cols="12"
      />
    </v-row>
  </v-container>
</template>

<script setup>
import urlJoin from 'url-join';
import {
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const { t, locale } = useI18n();

const credentialUrl = computed(() => {
  if (!props.modelValue?.endpoint) {
    return undefined;
  }

  const {
    requestorId,
    customerId,
    apiKey,
    params: sushiParams,
    endpoint,
  } = props.modelValue;

  const {
    sushiUrl,
    params: endpointParams,
  } = endpoint;

  const testedReport = endpoint.testedReport || 'pr';
  const harvestDateFormat = endpoint.harvestDateFormat || 'yyyy-MM';

  const url = new URL(urlJoin(sushiUrl, `reports/${testedReport}`));

  const threeMonthAgo = subMonths(new Date(), 3);
  url.search = new URLSearchParams(
    [
      ['begin_date', format(startOfMonth(threeMonthAgo), harvestDateFormat)],
      ['end_date', format(endOfMonth(threeMonthAgo), harvestDateFormat)],
      ['requestor_id', requestorId],
      ['customer_id', customerId],
      ['api_key', apiKey],
      ...[...endpointParams, ...sushiParams]
        .filter((param) => param.scope === 'report_download' || param.scope === `report_download_${testedReport}`)
        .map((param) => [param.name, param.value]),
    ].filter(([, value]) => !!value),
  ).toString();

  return url;
});

function formatDate(date) {
  return dateFormat(date, locale.value, 'PPPpp');
}

const fields = computed(() => [
  { value: formatDate(props.modelValue.createdAt) || '-', label: t('institutions.sushi.createdAt'), cols: 4 },
  { value: formatDate(props.modelValue.updatedAt) || '-', label: t('institutions.sushi.updatedAt'), cols: 4 },
  { value: formatDate(props.modelValue.connection?.date) || '-', label: t('institutions.sushi.testedAt'), cols: 4 },

  { value: props.modelValue.requestorId, label: t('institutions.sushi.requestorId'), cols: 4 },
  { value: props.modelValue.customerId, label: t('institutions.sushi.customerId'), cols: 4 },
  { value: props.modelValue.apiKey, label: t('institutions.sushi.apiKey'), cols: 4 },
].filter((f) => f.value));
</script>
