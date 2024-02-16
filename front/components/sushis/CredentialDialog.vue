<template>
  <v-dialog
    v-model="show"
    scrollable
    width="1000"
  >
    <v-card style="position: relative;">
      <v-card-title>
        {{ endpoint?.vendor }}

        <v-spacer />

        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          :label="$t('search')"
          solo
          dense
          hide-details
          autocomplete="off"
          style="max-width: 200px"
        />
      </v-card-title>

      <v-card-text style="position: relative;">
        <v-alert v-if="counts.status.failed > 0" type="error" prominent>
          {{ $tc('sushi.nErrsCredentials', counts.status.failed) }}
        </v-alert>

        <div class="d-flex justify-center align-stretch pa-2" style="gap: 10px">
          <SimpleMetric
            width="250"
            :text="$tc('sushi.nInstitutions', counts.institutions)"
            icon="mdi-domain"
          />

          <SimpleMetric
            width="250"
            :text="$tc('sushi.nOperationalCredentials', counts.status.success)"
            icon="mdi-check"
            color="success"
          />
          <SimpleMetric
            width="250"
            :text="$tc('sushi.nUntestedCredentials', counts.status.untested)"
            icon="mdi-bell-alert"
            color="info"
          >
            <template #actions>
              <div>
                <v-btn
                  small
                  outlined
                  :disabled="untestedItems.length <= 0"
                  :loading="testingConnection"
                  @click="checkUntestedItems"
                >
                  {{ $t('institutions.sushi.checkCredentials') }}
                </v-btn>
              </div>
            </template>
          </SimpleMetric>
          <SimpleMetric
            width="250"
            :text="$tc('sushi.nInvalidCredentials', counts.status.unauthorized)"
            icon="mdi-key-alert-outline"
            color="warning"
          />
        </div>

        <v-data-table
          v-model="selected"
          :headers="tableHeaders"
          :items="credentials"
          :search="search"
          :loading="loading"
          :options.sync="tableOptions"
          :custom-sort="customSort"
          :custom-filter="customFilter"
          show-select
          show-expand
          single-expand
          item-key="id"
          group-by="institution.name"
          class="mt-2"
          @pagination="currentItemCount = $event.itemsLength"
        >
          <template #top>
            <v-toolbar flat :dark="selected.length > 0">
              <template v-if="selected.length > 0">
                <v-btn icon @click="selected = []">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </template>

              <v-toolbar-title>
                {{ toolbarTitle }}
              </v-toolbar-title>

              <v-spacer />

              <template v-if="selected.length > 0">
                <v-btn
                  text :disabled="testingConnection || lockStatus"
                  @click="checkMultipleConnections"
                >
                  <v-icon left>
                    mdi-connection
                  </v-icon>
                  {{ $t('institutions.sushi.checkCredentials') }}
                </v-btn>
              </template>
            </v-toolbar>
          </template>

          <template #[`header.data-table-expand`]>
            <v-btn icon small @click="invertSort">
              <v-icon small>
                {{
                  tableOptions.groupDesc?.[0]
                    ? 'mdi-sort-alphabetical-descending'
                    : 'mdi-sort-alphabetical-ascending'
                }}
              </v-icon>
            </v-btn>
          </template>

          <template #[`item.tags`]="{ item }">
            <v-chip
              v-for="(tag, index) in item.tags"
              :key="index"
              small
              label
              class="mr-1"
              color="secondary"
            >
              {{ tag }}
            </v-chip>
          </template>

          <template #[`item.updatedAt`]="{ item }">
            <LocalDate :date="item.updatedAt" />
          </template>

          <template #[`item.connection`]="{ item }">
            <SushiConnectionIcon
              :connection="item.connection"
              :state="loadingItems[item.id]"
              :disabled="testingConnection"
              @checkConnection="() => checkSingleConnection(item)"
            />
          </template>

          <template #[`group.header`]="{ group, items, isOpen, headers, toggle }">
            <td :colspan="headers.length">
              <div class="d-flex align-center">
                <v-btn icon @click="toggle">
                  <v-icon>{{ isOpen ? 'mdi-minus' : 'mdi-plus' }}</v-icon>
                </v-btn>

                <div style="flex: 1;">
                  <template v-if="items?.[0]?.institution">
                    <nuxt-link :to="`/admin/institutions/${items[0].institution.id}`">
                      {{ items[0].institution.name }}
                    </nuxt-link>

                    <template v-if="items[0].institution.acronym">
                      ({{ items[0].institution.acronym }})
                    </template>
                  </template>
                  <i v-else>
                    {{ group }}
                  </i>
                </div>
              </div>
            </td>
          </template>

          <template #expanded-item="{ headers, item }">
            <td />
            <td :colspan="headers.length - 1" class="py-4">
              <SushiDetails :item="item" />
            </td>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import SushiConnectionIcon from '~/components/SushiConnectionIcon.vue';
import SushiDetails from '~/components/SushiDetails.vue';
import SimpleMetric from '~/components/SimpleMetric.vue';
import LocalDate from '~/components/LocalDate.vue';

export default {
  components: {
    SushiConnectionIcon,
    SushiDetails,
    SimpleMetric,
    LocalDate,
  },
  data: () => ({
    show: false,

    loading: false,
    loadingItems: {},
    lockStatus: false,

    search: '',
    selected: [],

    endpoint: null,

    tableOptions: {},
    currentItemCount: 0,
  }),
  computed: {
    tableHeaders() {
      return [
        {
          value: 'institution.name',
        },
        {
          text: this.$t('institutions.sushi.tags'),
          value: 'tags',
          sortable: false,
          width: 'auto',
        },
        {
          text: this.$t('status'),
          value: 'connection',
          align: 'center',
          width: '160px',
          sortable: false,
        },
        {
          text: this.$t('institutions.sushi.updatedAt'),
          value: 'updatedAt',
          sortable: false,
          width: '230px',
        },
      ];
    },
    credentials() {
      if (!Array.isArray(this.endpoint?.credentials)) {
        return [];
      }

      return this.endpoint.credentials;
    },
    untestedItems() {
      return this.credentials.filter((c) => !c.connection?.status);
    },
    institutionIds() {
      return [...new Set(this.credentials.map((c) => c.institutionId))];
    },
    testingConnection() {
      return Object.keys(this.loadingItems).length > 0;
    },
    toolbarTitle() {
      if (this.selected.length > 0) {
        return this.$t('nSelected', { count: this.selected.length });
      }

      let count = this.credentials?.length;
      if (count != null && this.currentItemCount !== count) {
        count = `${this.currentItemCount}/${count}`;
      }

      return this.$t('institutions.sushi.title', { total: count ?? '?' });
    },
    counts() {
      const statusCounts = {
        untested: 0,
        success: 0,
        failed: 0,
        unauthorized: 0,
      };

      // eslint-disable-next-line no-restricted-syntax
      for (const credential of this.credentials) {
        const status = credential.connection?.status || 'untested';
        statusCounts[status] += 1;
      }

      return {
        status: statusCounts,
        institutions: this.institutionIds.length,
      };
    },
  },
  methods: {
    display(endpoint) {
      this.endpoint = endpoint;
      this.show = true;
      this.search = '';
      this.selected = [];
      this.tableOptions = {
        itemsPerPage: 10,
        groupDesc: [false],
      };
      this.refresh();
    },

    async refresh() {
      this.loading = true;

      try {
        const status = await this.$axios.$get('/sushi/_lock');
        this.lockStatus = status.locked && !this.$auth.hasScope('superuser');
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('sushi.unableToGetLockStatus'));
      }

      this.loading = false;
    },

    customFilter(value, search, item) {
      if (!search) {
        return true;
      }

      const { institution } = item;
      const s = search?.toLowerCase();
      const isSearchIn = (str) => str?.toLowerCase()?.includes(s);

      const isInName = isSearchIn(institution?.name);
      const isInAcronym = isSearchIn(institution?.acronym);
      const isInTag = item.tags.some(isSearchIn);
      return isInName || isInAcronym || isInTag;
    },

    customSort(items) {
      return items.sort((a, b) => {
        const groupA = a.institution?.name;
        const groupB = b.institution?.name;

        const res = groupA?.localeCompare?.(groupB, this.$i18n.locale, { sensitivity: 'base' });
        return this.tableOptions.groupDesc?.[0] ? -res : res;
      });
    },

    invertSort() {
      this.tableOptions.groupDesc = [!this.tableOptions.groupDesc?.[0]];
    },

    async checkSingleConnection(sushiItem) {
      this.$set(this.loadingItems, sushiItem.id, true);

      try {
        const data = await this.$axios.$post(`/sushi/${sushiItem.id}/_check_connection`);
        this.$set(sushiItem, 'connection', data?.connection);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('institutions.sushi.cannotCheckCredentials', { name: sushiItem?.endpoint?.vendor }));
      }

      this.$delete(this.loadingItems, sushiItem.id);
    },

    async checkMultipleConnections() {
      if (this.selected.length <= 0) { return; }

      const selected = this.selected.slice();

      this.selected = [];

      for (let i = 0; i < selected.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await this.checkSingleConnection(selected[i]);
      }
    },

    checkUntestedItems() {
      if (this.untestedItems.length > 0) {
        this.selected = this.untestedItems.slice();
        this.checkMultipleConnections();
      }
    },
  },
};
</script>
