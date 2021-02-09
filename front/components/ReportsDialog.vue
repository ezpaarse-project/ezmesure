<template>
  <v-dialog v-model="show" width="800">
    <v-card>
      <v-toolbar flat color="rgba(0, 0, 0, 0)">
        <v-toolbar-title v-text="$t('reports.availableReports')" />

        <v-spacer />

        <v-btn text color="primary" :loading="refreshing" @click="refreshReports">
          <v-icon left>
            mdi-refresh
          </v-icon>
          {{ $t('refresh') }}
        </v-btn>
      </v-toolbar>

      <v-card-text>
        <v-alert
          v-for="(message, index) in exceptions"
          :key="index"
          :value="true"
          type="error"
          outlined
          dense
          icon="mdi-alert-circle"
        >
          {{ message }}
        </v-alert>
      </v-card-text>

      <v-data-table
        :headers="headers"
        :items="reports"
        :loading="refreshing"
        item-key="Report_ID"
      />

      <v-divider />

      <v-card-actions>
        <v-spacer />

        <v-btn text @click="show = false">
          {{ $t('close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      show: false,
      exceptions: [],
      refreshing: false,
      sushi: null,
      reports: [],
    };
  },
  computed: {
    hasSushiItem() { return !!this.sushi?.id; },
    hasExceptions() { return this.exceptions.length > 0; },
    headers() {
      return [
        {
          align: 'left',
          text: this.$t('name'),
          value: 'Report_Name',
        }, {
          align: 'left',
          text: this.$t('identifier'),
          value: 'Report_ID',
        },
      ];
    },
  },
  methods: {
    showReports(sushiData = {}) {
      this.sushi = sushiData;
      this.reports = [];
      this.exceptions = [];
      this.show = true;
      this.refreshReports();
    },

    async refreshReports() {
      if (!this.hasSushiItem) { return; }

      this.exceptions = [];
      this.refreshing = true;

      try {
        this.reports = await this.$axios.$get(`/sushi/${this.sushi.id}/reports`);
      } catch (e) {
        const exceptions = e?.response?.data?.exceptions;

        if (Array.isArray(exceptions)) {
          this.exceptions = exceptions;
        }
        this.$store.dispatch('snacks/error', this.$t('reports.failedToFetchReports'));
      }

      this.refreshing = false;
    },
  },
};
</script>
