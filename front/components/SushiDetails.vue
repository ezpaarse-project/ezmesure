<template>
  <v-row>
    <SushiDetailsField
      v-for="field in fields"
      :key="field.label"
      :value="field.value"
      :label="field.label"
      :cols="field.cols"
    />

    <SushiDetailsField
      v-if="hasParams"
      :label="$t('advancedSettings')"
      cols="12"
    >
      <v-tooltip v-for="param in item.params" :key="param.name" top>
        <template #activator="{ on, attrs }">
          <v-chip label class="mr-1" v-bind="attrs" v-on="on">
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
      <a :href="credentialUrl.href" target="_blank" rel="noreferrer noopener">
        {{ credentialUrl.href }}
      </a>
    </SushiDetailsField>

    <SushiDetailsField
      v-if="item.comment"
      :value="item.comment"
      :label="$t('institutions.sushi.comment')"
      cols="12"
    />
  </v-row>
</template>

<script>
import {
  format, subMonths, startOfMonth, endOfMonth,
} from 'date-fns';

import SushiDetailsField from '~/components/sushis/SushiDetailsField.vue';

export default {
  components: {
    SushiDetailsField,
  },
  props: {
    item: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {};
  },
  computed: {
    hasParams() {
      return Array.isArray(this.item?.params) && this.item.params.length > 0;
    },
    credentialUrl() {
      if (!this.item?.endpoint) {
        return undefined;
      }

      const {
        requestorId,
        customerId,
        apiKey,
        params: sushiParams,
        endpoint,
      } = this.item;

      const {
        sushiUrl,
        params: endpointParams,
      } = endpoint;

      const testedReport = endpoint.testedReport || 'pr';
      const harvestDateFormat = endpoint.harvestDateFormat || 'yyyy-MM';

      const url = new URL(`reports/${testedReport}`, sushiUrl);

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
    },
    fields() {
      return [
        { value: this.formatDate(this.item?.createdAt) || '-', label: this.$t('institutions.sushi.createdAt'), cols: 4 },
        { value: this.formatDate(this.item?.updatedAt) || '-', label: this.$t('institutions.sushi.updatedAt'), cols: 4 },
        { value: this.formatDate(this.item?.connection?.date) || '-', label: this.$t('institutions.sushi.testedAt'), cols: 4 },
        { value: this.item?.requestorId, label: this.$t('institutions.sushi.requestorId'), cols: 4 },
        { value: this.item?.customerId, label: this.$t('institutions.sushi.customerId'), cols: 4 },
        { value: this.item?.apiKey, label: this.$t('institutions.sushi.apiKey'), cols: 4 },
      ].filter((f) => f.value);
    },
  },
  methods: {
    formatDate(date) {
      if (!date) {
        return undefined;
      }

      const localDate = new Date(date);

      if (!this.$dateFunctions.isValid(localDate)) {
        return this.$t('invalidDate');
      }

      return this.$dateFunctions.format(localDate, 'PPPpp');
    },
  },
};
</script>
