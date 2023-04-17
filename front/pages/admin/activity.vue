<template>
  <section>
    <ToolBar
      :title="$t('menu.activity')"
    >
      <v-spacer />

      <v-btn text :loading="loading" @click="loadActivity">
        <v-icon left>
          mdi-refresh
        </v-icon>
        {{ $t('refresh') }}
      </v-btn>
    </ToolBar>

    <v-data-table
      :headers="tableHeaders"
      :items="activity"
      :loading="loading"
      :options.sync="tableOptions"
      :server-items-length="totalItems"
      :footer-props="{ itemsPerPageOptions: [20, 50, 100, 500] }"
      :no-data-text="$t('activity.noActivity')"
      dense
      item-key="id"
      sort-by="datetime"
      :sort-desc="true"
      @update:options="loadActivity"
    >
      <template #top>
        <v-container fluid>
          <v-row>
            <v-col cols="12" lg="4" class="d-flex justify-start align-center">
              <v-btn
                icon
                color="primary"
                :disabled="loading"
                @click="previousDay"
              >
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>

              <v-menu
                v-model="showDatePicker"
                :close-on-content-click="false"
                :nudge-right="40"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template #activator="{ on, attrs }">
                  <span
                    class="text-h4 mx-2"
                    v-bind="attrs"
                    v-on="on"
                  >
                    {{ $dateFunctions.format(new Date(date), 'PPP') }}
                  </span>
                </template>

                <v-date-picker
                  v-model="date"
                  :locale="$i18n.locale"
                  @input="showDatePicker = false"
                />
              </v-menu>

              <v-btn
                icon
                color="primary"
                :disabled="loading"
                @click="nextDay"
              >
                <v-icon>mdi-arrow-right</v-icon>
              </v-btn>
            </v-col>

            <v-col cols="12" md="6" lg="4">
              <v-combobox
                ref="actionCombo"
                v-model="selectedActions"
                :items="availableActions"
                :label="$t('activity.action')"
                item-text="label"
                item-value="value"
                hide-details
                clearable
                hide-no-data
                multiple
                outlined
                dense
                @change="loadActivity"
              >
                <template #selection="{ item, index }">
                  <v-chip v-if="index === 0" small label>
                    <span>{{ item.label }}</span>
                  </v-chip>
                  <span
                    v-if="index === 1"
                    class="grey--text text-caption"
                  >
                    (+{{ selectedActions.length - 1 }} others)
                  </span>
                </template>
              </v-combobox>
            </v-col>

            <v-col cols="12" md="6" lg="4">
              <v-combobox
                ref="userCombo"
                v-model="selectedUsers"
                :label="$t('activity.user')"
                hide-details
                clearable
                hide-no-data
                multiple
                outlined
                dense
                @change="loadActivity"
              >
                <template #selection="{ attrs, item, parent, selected }">
                  <v-chip
                    v-bind="attrs"
                    :input-value="selected"
                    label
                    small
                  >
                    <span class="pr-2">
                      {{ item }}
                    </span>
                    <v-icon small @click="parent.selectItem(item)">
                      $delete
                    </v-icon>
                  </v-chip>
                </template>
              </v-combobox>
            </v-col>
          </v-row>
        </v-container>
      </template>

      <template #[`item.action`]="{ item }">
        <v-hover v-slot="{ hover }">
          <span>
            <span v-if="$te(`activity.actions.${item.action}`)">
              {{ $t(`activity.actions.${item.action}`) }}
            </span>
            <span v-else>
              {{ item.action }}
            </span>

            <v-btn
              v-if="hover"
              x-small
              icon
              color="primary"
              @click="filterAction(item.action)"
            >
              <v-icon>
                mdi-filter
              </v-icon>
            </v-btn>
          </span>
        </v-hover>
      </template>

      <template #[`item.datetime`]="{ item }">
        <LocalDate
          :date="item.datetime"
          format="Pp"
        />
      </template>

      <template #[`item.user.name`]="{ item }">
        <v-menu
          v-if="item.user"
          :close-on-content-click="false"
          :nudge-width="200"
          open-on-hover
          offset-x
        >
          <template #activator="{ on, attrs }">
            <v-chip
              small
              outlined
              v-bind="attrs"
              v-on="on"
            >
              <v-icon left>
                mdi-account
              </v-icon>
              {{ item.user && item.user.name }}
            </v-chip>
          </template>

          <v-card>
            <v-list>
              <v-list-item>
                <v-list-item-action>
                  <v-icon>mdi-account-circle</v-icon>
                </v-list-item-action>

                <v-list-item-content>
                  <v-list-item-title>
                    {{ item.user.name }}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>

              <v-divider />

              <v-list-item>
                <v-list-item-action>
                  <v-icon>mdi-shield</v-icon>
                </v-list-item-action>

                <v-list-item-content>
                  <v-list-item-title>
                    <v-chip
                      v-for="role in item.user.roles"
                      :key="role"
                      class="mr-1"
                      small
                      label
                    >
                      {{ role }}
                    </v-chip>
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>

            <v-card-actions>
              <v-spacer />
              <v-btn small text color="primary" @click="filterUsername(item.user.name)">
                <v-icon left>
                  mdi-filter
                </v-icon>
                {{ $t('activity.filter') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </template>

      <template #[`item.details`]="{ item }">
        <ActivityItemDetails :item="item" />
      </template>

      <template #[`item.actions`]="{ item }">
        <v-btn
          text
          small
          @click="showRawItem(item)"
        >
          <v-icon left>
            mdi-file-code-outline
          </v-icon>
          JSON
        </v-btn>
      </template>
    </v-data-table>

    <v-dialog
      v-model="showRawItemDialog"
      max-width="1000px"
    >
      <v-card>
        <v-card-text class="pa-4" style="overflow: auto">
          <pre>{{ rawItem }}</pre>
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <v-btn text @click="showRawItemDialog = false">
            {{ $t('close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </section>
</template>

<script>
import { addDays, subDays, format } from 'date-fns';

import ToolBar from '~/components/space/ToolBar.vue';
import LocalDate from '~/components/LocalDate.vue';
import ActivityItemDetails from '~/components/ActivityItemDetails.vue';

export default {
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ToolBar,
    LocalDate,
    ActivityItemDetails,
  },
  data() {
    return {
      date: format(new Date(), 'yyyy-MM-dd'),
      tableOptions: {},
      metricTypes: [],
      loading: false,
      showDatePicker: false,
      activity: [],
      totalItems: 0,
      selectedActions: [],
      selectedUsers: [],
      rawItem: '',
      showRawItemDialog: false,
    };
  },
  mounted() {
    return this.loadActivity();
  },
  watch: {
    date() {
      this.tableOptions.page = 1;
      this.loadActivity();
    },
  },
  computed: {
    tableHeaders() {
      return [
        { text: this.$t('date'), value: 'datetime', width: '180px' },
        { text: this.$t('activity.user'), value: 'user.name', width: '250px' },
        { text: this.$t('activity.action'), value: 'action', width: '300px' },
        { text: this.$t('activity.details'), value: 'details', sortable: false },
        {
          text: this.$t('actions'),
          value: 'actions',
          sortable: false,
          width: '85px',
          align: 'center',
        },
      ];
    },
    availableActions() {
      const availableActions = [
        { header: 'users' },
        'user/register',
        'user/refresh',
        'user/connection',
        { header: 'files' },
        'file/upload',
        'file/list',
        'file/delete',
        'file/delete-many',
        { header: 'institutions' },
        'institutions/create',
        'institutions/update',
        'institutions/delete',
        'institutions/addMember',
        'institutions/removeMember',
        { header: 'exports' },
        'export/aggregate',
        'export/counter5',
        'events/delete',
        { header: 'indices' },
        'indices/tops',
        'indices/list',
        'indices/delete',
        'indices/search',
        'indices/insert',
        { header: 'sushi' },
        'sushi/create',
        'sushi/update',
        'sushi/delete',
        'sushi/delete-many',
        'sushi/download-report',
        'sushi/harvest',
        'sushi/import',
        'sushi/check-connection',
        { header: 'endpoints' },
        'endpoint/create',
        'endpoint/update',
        'endpoint/delete',
        'endpoint/import',
        { header: 'reporting' },
        'reporting/index',
        'reporting/getDashboards',
        'reporting/list',
        'reporting/store',
        'reporting/update',
        'reporting/delete',
        'reporting/history',
      ];

      return availableActions.map((item) => {
        if (item.header) {
          item.header = this.$t(`activity.actionTypes.${item.header}`);
          return item;
        }
        return {
          label: this.$t(`activity.actions.${item}`),
          value: item,
        };
      });
    },
  },
  methods: {
    nextDay() {
      this.date = format(addDays(new Date(this.date), 1), 'yyyy-MM-dd');
    },
    previousDay() {
      this.date = format(subDays(new Date(this.date), 1), 'yyyy-MM-dd');
    },
    async loadActivity() {
      if (this.loading) { return; }

      this.loading = true;

      const sortBy = this.tableOptions?.sortBy?.[0];
      const sortDesc = this.tableOptions?.sortDesc?.[0];

      const params = {
        size: this.tableOptions?.itemsPerPage || 20,
        page: this.tableOptions?.page || 1,
        date: this.date,
        sortBy,
      };

      if (typeof sortBy === 'string' && typeof sortDesc === 'boolean') {
        params.sortOrder = sortDesc ? 'desc' : 'asc';
      }

      if (this.selectedActions.length > 0) {
        params.type = this.selectedActions.map((item) => item.value).join(',');
      }
      if (this.selectedUsers.length > 0) {
        params.username = this.selectedUsers.join(',');
      }

      try {
        const data = await this.$axios.$get('/activity', { params });

        this.activity = Array.isArray(data?.items) ? data.items : [];
        this.totalItems = data?.total?.value;
        if (!Number.isInteger(this.totalItems)) {
          this.totalItems = this.activity.length;
        }
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('activity.failedToLoad'));
      }

      this.loading = false;
    },
    showRawItem(item) {
      this.rawItem = JSON.stringify(item, null, 2);
      this.showRawItemDialog = true;
    },
    filterAction(name) {
      this.$refs.actionCombo.selectItem({
        label: this.$t(`activity.actions.${name}`),
        value: name,
      });
    },
    filterUsername(name) {
      this.$refs.userCombo.selectItem(name);
    },
  },
};
</script>
