<template>
  <v-card min-height="500">
    <v-card-title primary-title>
      <div>
        {{ $t('sushi.harvestState') }}
        <div class="caption">
          {{ sushiVendor }} - {{ sushiTags }}
        </div>
      </div>

      <v-spacer />

      <v-btn
        color="primary"
        text
        :loading="loading"
        @click.stop="refreshHarvests"
      >
        <v-icon left>
          mdi-refresh
        </v-icon>
        {{ $t('refresh') }}
      </v-btn>
    </v-card-title>

    <v-data-table
      :headers="tableHeaders"
      :items="harvestsByType"
      :items-per-page="-1"
      :loading="loading"
      :options="{ sortBy: ['reportId'], sortDesc: [false] }"
      hide-default-footer
    >
      <template #top>
        <div class="d-flex justify-center align-center">
          <v-btn
            icon
            color="primary"
            :disabled="loading"
            @click="year -= 1"
          >
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>

          <span class="text-h4 mx-3">
            {{ year }}
          </span>

          <v-btn
            icon
            color="primary"
            :disabled="loading"
            @click="year += 1"
          >
            <v-icon>mdi-arrow-right</v-icon>
          </v-btn>
        </div>
      </template>

      <template v-for="period in periods" #[`item.${period}`]="{ item }">
        <HarvestStateCell
          v-if="item[period]"
          :key="period"
          :harvest="item[period]"
        />
      </template>
    </v-data-table>

    <v-spacer />
    <slot name="actions" />
  </v-card>
</template>

<script>
import {
  getYear,
  set,
  format,
} from 'date-fns';

import HarvestStateCell from '~/components/HarvestStateCell.vue';

export default {
  components: {
    HarvestStateCell,
  },
  props: {
    sushiItem: {
      type: Object,
      default: () => ({}),
    },
    initialYear: {
      type: Number,
      default: undefined,
    },
  },
  data() {
    return {
      harvests: [],
      year: getYear(new Date()),
      errorMessage: '',
      loading: false,
    };
  },
  watch: {
    sushiId: {
      immediate: true,
      handler() { this.refreshHarvests(); },
    },
    initialYear: {
      immediate: true,
      handler(val) { if (val != null) { this.year = val; } },
    },
    year() {
      this.refreshHarvests();
    },
  },
  computed: {
    sushiId() { return this.sushiItem?.id; },
    sushiVendor() { return this.sushiItem?.endpoint?.vendor; },
    sushiTags() { return this.sushiItem?.tags?.join?.(', '); },
    harvestsByType() {
      const harvestsByType = this.harvests.reduce((acc, harvest) => {
        const reportId = harvest.reportId?.toUpperCase?.();

        if (!acc.has(reportId)) {
          acc.set(reportId, { reportId });
        }

        acc.get(reportId)[harvest.period] = harvest;
        return acc;
      }, new Map());

      return Array.from(harvestsByType.values());
    },
    tableHeaders() {
      return [
        {
          align: 'left',
          text: this.$t('sushi.report'),
          value: 'reportId',
        },
        ...this.periods.map((period) => ({ text: period, value: period })),
      ];
    },
    periods() {
      const periods = [];

      for (let i = 0; i <= 11; i += 1) {
        periods.push(format(set(new Date(), { year: this.year, month: i }), 'yyyy-MM'));
      }

      return periods;
    },
  },
  methods: {
    async refreshHarvests() {
      if (!this.sushiId) { return; }

      this.loading = true;
      this.errorMessage = '';

      try {
        this.harvests = await this.$axios.$get(`/sushi/${this.sushiId}/harvests`, {
          params: {
            from: format(set(new Date(), { year: this.year, month: 0 }), 'yyyy-MM'),
            to: format(set(new Date(), { year: this.year, month: 11 }), 'yyyy-MM'),
            sort: 'period',
            order: 'asc',
          },
        });
      } catch (e) {
        this.errorMessage = e?.response?.data?.error || this.$t('anErrorOccurred');
      }

      this.loading = false;
    },
  },
};
</script>
