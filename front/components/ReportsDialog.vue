<template>
  <v-dialog v-model="show" width="800">
    <v-card>
      <v-toolbar flat color="rgba(0, 0, 0, 0)">
        <v-toolbar-title>
          {{ $t('reports.availableReportsOnPlatform') }}
          <div class="caption">
            {{ sushiVendor }} - {{ sushiPackage }}
          </div>
        </v-toolbar-title>

        <v-spacer />

        <v-btn text color="primary" :loading="refreshing" @click="refreshReports">
          <v-icon left>
            mdi-refresh
          </v-icon>
          {{ $t('refresh') }}
        </v-btn>
      </v-toolbar>

      <v-card-text v-if="hasExceptions">
        <v-alert text color="error">
          <v-row align="center" no-gutters>
            <v-col class="grow">
              {{ $t('reports.sushiReturnedErrors') }}
            </v-col>

            <v-col class="shrink">
              <v-btn
                color="error"
                small
                outlined
                @click="editSushiItem"
              >
                {{ $t('reports.checkCredentials') }}
              </v-btn>
            </v-col>
          </v-row>

          <ul>
            <li
              v-for="(message, index) in exceptionStrings"
              :key="index"
            >
              {{ message }}
            </li>
          </ul>
        </v-alert>
      </v-card-text>

      <v-simple-table>
        <template #default>
          <thead>
            <tr>
              <th class="text-left">
                {{ $t('name') }}
              </th>
              <th class="text-left">
                {{ $t('identifier') }}
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
            </tr>
          </tbody>
        </template>
      </v-simple-table>

      <v-divider />

      <v-card-actions>
        <v-checkbox
          v-model="showAllReports"
          :label="$t('reports.showAllReports')"
        />

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
      showAllReports: false,
      sushi: null,
      reports: [],
    };
  },
  computed: {
    hasSushiItem() { return !!this.sushi?.id; },
    hasExceptions() { return this.exceptions.length > 0; },
    sushiVendor() { return this.sushi?.vendor; },
    sushiPackage() { return this.sushi?.package; },
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
    exceptionStrings() {
      return this.exceptions.map((exception) => {
        const {
          Code: code,
          Severity: severity,
          Message: msg,
        } = exception;

        let message = severity ? `[${severity}] ` : '';
        message += code ? `[#${code}] ` : '';
        message += msg;
        return message;
      });
    },
    filteredReports() {
      if (this.showAllReports) { return this.reports; }

      return this.reports.filter((report) => {
        // eslint-disable-next-line camelcase
        if (typeof report?.Report_ID !== 'string') { return false; }
        return !report.Report_ID.includes('_');
      });
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

    editSushiItem() {
      this.show = false;
      this.$emit('editItem', this.sushi);
    },

    async refreshReports() {
      if (!this.hasSushiItem) { return; }

      this.exceptions = [];
      this.refreshing = true;

      try {
        this.reports = await this.$axios.$get(`/sushi/${this.sushi.id}/reports`);
      } catch (e) {
        const exceptions = e?.response?.data?.exceptions;
        const error = e?.response?.data?.error;

        if (Array.isArray(exceptions)) {
          this.exceptions = exceptions;
        } else if (typeof error === 'string') {
          this.exceptions = [{ Message: error }];
        }

        this.$store.dispatch('snacks/error', this.$t('reports.failedToFetchReports'));
      }

      this.refreshing = false;
    },
  },
};
</script>
