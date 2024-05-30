<template>
  <section>
    <ToolBar :title="endpoint?.vendor">
      <v-spacer />

      <v-tooltip left open-on-hover>
        <template #activator="{ on, attrs }">
          <div
            v-bind="attrs"
            v-on="on"
          >
            <v-switch
              :input-value="endpoint.active"
              :label="endpoint.active
                ? $t('endpoints.active')
                : $t('endpoints.inactive')"
              :loading="refreshing"
              hide-details
              role="switch"
              class="mr-2"
              dense
              @change="toggleEndpointActiveState()"
            />
          </div>
        </template>

        <i18n :path="`endpoints.${endpoint.active ? 'activeSince' : 'inactiveSince'}`" tag="span">
          <template #date>
            <LocalDate :date="endpoint.activeUpdatedAt" />
          </template>
        </i18n>
      </v-tooltip>

      <v-btn
        color="primary"
        text
        @click.stop="editEndpoint()"
      >
        <v-icon left>
          mdi-pencil
        </v-icon>
        {{ $t('update') }}
      </v-btn>
    </ToolBar>

    <v-card-text style="position: relative;">
      <v-alert v-if="!endpoint.active" type="warning" text>
        <div class="text-h6">
          {{ $t('endpoints.inactive') }}
        </div>

        {{ $t('endpoints.inactiveDescription') }}
      </v-alert>

      <v-alert v-if="counts.status.failed > 0" type="error" prominent>
        {{ $tc('sushi.nErrsCredentials', counts.status.failed) }}
      </v-alert>

      <div class="d-flex justify-center align-stretch pa-2" style="gap: 10px">
        <SimpleMetric
          width="250"
          :text="$tc('sushi.nInstitutions', institutions.size)"
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

      <v-toolbar flat :dark="selectedInstitutionsIds.length > 0">
        <template v-if="selectedInstitutionsIds.length > 0">
          <v-btn icon @click="selectedInstitutionsIds = []">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>

        <v-toolbar-title>
          {{ toolbarTitle }}
        </v-toolbar-title>

        <v-spacer />

        <div v-if="selectedInstitutionsIds.length > 0" class="d-flex align-center">
          <v-tooltip top>
            <template #activator="{ on }">
              <v-btn icon class="mr-2" @click="checkSelectedInstitutionCredentials" v-on="on">
                <v-icon>mdi-connection</v-icon>
              </v-btn>
            </template>
            {{ $t('institutions.sushi.checkCredentials') }}
          </v-tooltip>

          <v-tooltip top>
            <template #activator="{ on }">
              <v-btn icon class="mr-2" @click="copyMailList" v-on="on">
                <v-icon>
                  mdi-email-multiple
                </v-icon>
              </v-btn>
            </template>
            {{ $t('institutions.createMailContactList') }}
          </v-tooltip>
        </div>
        <div v-else class="d-flex align-center">
          <v-tooltip top>
            <template #activator="{ on }">
              <v-btn
                icon
                :loading="refreshing"
                class="mr-2"
                @click.stop="refreshCredentials()"
                v-on="on"
              >
                <v-icon>
                  mdi-refresh
                </v-icon>
              </v-btn>
            </template>

            {{ $t('refresh') }}
          </v-tooltip>

          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            :label="$t('search')"
            solo
            dense
            hide-details
            autocomplete="off"
            style="max-width: 200px"
            @input="debouncedRefreshCredentials()"
          />
        </div>
      </v-toolbar>

      <div class="tree-header text--secondary">
        <div style="width: 14px" />
        <div>
          <v-simple-checkbox
            :value="selectedState === 'full'"
            :indeterminate="selectedState === 'partial'"
            @input="selectAllInstitutions"
          />
        </div>
        <div style="width: 24px" />
        <v-spacer />
        <div style="width: 135px; text-align: center;">
          {{ $t('institutions.sushi.lastHarvest') }}
        </div>
        <div style="width: 110px; text-align: center;">
          {{ $t('status') }}

          <DropdownSelector
            v-model="filters.connection"
            :items="availableConnections"
            icon="mdi-filter"
            icon-button
            badge
            @input="refreshCredentials()"
          />
        </div>
        <div style="width: 175px; text-align: center;">
          {{ $t('institutions.sushi.updatedAt') }}
        </div>
      </div>

      <v-treeview
        ref="treeView"
        :value="selectedInstitutionsIds"
        :items="institutionsItems"
        hoverable
        dense
      >
        <template #prepend="{ item, leaf, selected }">
          <EndpointCredentialsPrepend v-if="leaf" :item="item" :endpoint="endpoint" />

          <EndpointInstitutionPrepend
            v-else
            :item="item"
            :selected="selected"
            @updateModel:selected="toggleSelection(item.id)"
          />
        </template>

        <template #label="{ item, leaf }">
          <EndpointCredentialsLabel v-if="leaf" :item="item" />
          <EndpointInstitutionLabel v-else :item="item" />
        </template>

        <template #append="{ item, leaf }">
          <EndpointCredentialsAppend
            v-if="leaf"
            :item="item"
            :state="loadingItems[item.id]"
            @checkConnection="addCredentialsToCheck(item)"
          />
          <EndpointInstitutionAppend v-else :item="item" />
        </template>
      </v-treeview>
    </v-card-text>

    <EndpointForm
      ref="endpointForm"
      @update="refreshEndpoint()"
    />
  </section>
</template>

<script>
import debounce from 'lodash.debounce';

import LocalDate from '~/components/LocalDate.vue';
import SimpleMetric from '~/components/SimpleMetric.vue';
import ToolBar from '~/components/space/ToolBar.vue';
import DropdownSelector from '~/components/DropdownSelector.vue';
import EndpointForm from '~/components/EndpointForm.vue';

import EndpointCredentialsPrepend from '~/components/endpoints/EndpointCredentialsPrepend.vue';
import EndpointCredentialsLabel from '~/components/endpoints/EndpointCredentialsLabel.vue';
import EndpointCredentialsAppend from '~/components/endpoints/EndpointCredentialsAppend.vue';
import EndpointInstitutionPrepend from '~/components/endpoints/EndpointInstitutionPrepend.vue';
import EndpointInstitutionLabel from '~/components/endpoints/EndpointInstitutionLabel.vue';
import EndpointInstitutionAppend from '~/components/endpoints/EndpointInstitutionAppend.vue';

export default {
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    LocalDate,
    SimpleMetric,
    ToolBar,
    DropdownSelector,
    EndpointForm,
    EndpointCredentialsPrepend,
    EndpointCredentialsLabel,
    EndpointCredentialsAppend,
    EndpointInstitutionPrepend,
    EndpointInstitutionLabel,
    EndpointInstitutionAppend,
  },
  async asyncData({
    $axios,
    params,
  }) {
    let endpoint = null;
    let failedToFetch = false;

    try {
      endpoint = await $axios.$get(`/sushi-endpoints/${params.id}`);
    } catch (e) {
      if (e.response?.status !== 404) {
        failedToFetch = true;
      }
    }
    return {
      failedToFetch,
      loadingItems: {},
      refreshing: false,

      search: '',
      selectedInstitutionsIds: [],
      credentialsToCheck: [],

      endpoint,
      credentials: [],

      tableOptions: {
        groupBy: ['institution.name'],
      },
      credentialsCount: 0,
      filters: {},
    };
  },
  computed: {
    availableConnections() {
      return [
        { text: this.$t('institutions.sushi.untested'), value: 'untested' },
        { text: this.$t('institutions.sushi.operational'), value: 'working' },
        { text: this.$t('institutions.sushi.invalidCredentials'), value: 'unauthorized' },
        { text: this.$t('error'), value: 'faulty' },
      ];
    },
    untestedItems() {
      return this.credentials.filter((c) => !c.connection?.status);
    },
    selectedState() {
      if (this.selectedInstitutionsIds.length <= 0) {
        return 'empty';
      }
      if (this.selectedInstitutionsIds.length === this.institutions.size) {
        return 'full';
      }
      return 'partial';
    },
    testingConnection() {
      return Object.keys(this.loadingItems).length > 0;
    },
    toolbarTitle() {
      if (this.selectedInstitutionsIds.length > 0) {
        return this.$t('nSelected', { count: this.selectedInstitutionsIds.length });
      }

      let count = this.credentials?.length;
      if (count != null && this.credentialsCount !== count) {
        count = `${count}/${this.credentialsCount}`;
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
      };
    },
    institutions() {
      const institutions = new Map();

      // eslint-disable-next-line no-restricted-syntax
      for (const { institution, ...item } of this.credentials) {
        const credentials = institutions.get(item.institutionId)?.children || [];
        credentials.push(item);

        institutions.set(item.institutionId, {
          ...institution,
          children: credentials,
        });
      }

      return institutions;
    },
    institutionsItems() {
      return Array.from(this.institutions.values());
    },
  },
  mounted() {
    this.refreshCredentials().then(() => { this.$refs.treeView?.updateAll?.(true); });
  },
  methods: {
    editEndpoint() {
      this.$refs.endpointForm.editEndpoint(this.endpoint);
    },

    toggleSelection(item) {
      const selected = new Set(this.selectedInstitutionsIds);
      if (selected.has(item)) {
        selected.delete(item);
      } else {
        selected.add(item);
      }
      this.selectedInstitutionsIds = Array.from(selected);
    },

    selectAllInstitutions() {
      if (this.selectedState === 'full') {
        this.selectedInstitutionsIds = [];
        return;
      }
      this.selectedInstitutionsIds = Array.from(this.institutions.keys());
    },

    async checkFirstConnection() {
      const item = this.credentialsToCheck.shift();
      if (!item) {
        return;
      }

      this.$set(this.loadingItems, item.id, 'loading');

      try {
        const data = await this.$axios.$post(`/sushi/${item.id}/_check_connection`);
        this.$set(item, 'connection', data?.connection);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('institutions.sushi.cannotCheckCredentials', { name: item.endpoint?.vendor }));
      }

      this.$delete(this.loadingItems, item.id);

      if (this.credentialsToCheck.length > 0) {
        this.checkFirstConnection();
      }
    },

    addCredentialsToCheck(item) {
      const isChecking = this.testingConnection;
      this.credentialsToCheck.push(item);
      this.$set(this.loadingItems, item.id, 'queued');
      if (isChecking) {
        return;
      }

      this.checkFirstConnection();
    },

    checkSelectedInstitutionCredentials() {
      // eslint-disable-next-line no-restricted-syntax
      for (const id of this.selectedInstitutionsIds) {
        const item = this.institutions.get(id);
        if (item) {
          // eslint-disable-next-line no-restricted-syntax
          for (const credentials of item.children) {
            this.addCredentialsToCheck(credentials);
          }
        }
      }
    },

    checkUntestedItems() {
      if (this.untestedItems.length <= 0) {
        return;
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const item of this.untestedItems) {
        this.addCredentialsToCheck(item);
      }
    },

    async copyMailList() {
      if (!navigator.clipboard) {
        this.$store.dispatch('snacks/error', this.$t('unableToCopyId'));
        return;
      }

      const addresses = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const id of this.selectedInstitutionsIds) {
        const institution = this.institutions.get(id);
        if (institution) {
          addresses.push(
            ...institution.memberships
              .filter((m) => m.roles?.some((r) => /^contact:/i.test(r)) || false)
              .map((m) => m.user.email),
          );
        }
      }

      try {
        await navigator.clipboard.writeText(addresses);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('unableToCopyId'));
        return;
      }
      this.$store.dispatch('snacks/info', this.$t('emailsCopied'));
    },

    async toggleEndpointActiveState() {
      const active = !this.endpoint.active;

      this.refreshing = true;
      await this.$axios.$patch(`/sushi-endpoints/${this.endpoint.id}`, { active });

      await this.refreshEndpoint();
    },

    async refreshEndpoint() {
      this.refreshing = true;
      try {
        this.endpoint = await this.$axios.$get(`/sushi-endpoints/${this.endpoint.id}`);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('endpoints.noEndpointFound'));
      }
      this.refreshing = false;
    },

    async refreshCredentials() {
      this.refreshing = true;

      const params = {
        include: ['harvests', 'institution.memberships.user'],
        endpointId: this.endpoint.id,
        q: this.search,
        size: 0,
        sort: this.tableOptions.groupBy[0],
        ...this.filters,
      };

      try {
        const { data, headers } = await this.$axios.get('/sushi', { params });

        this.credentials = data;
        this.credentialsCount = Number.parseInt(headers['x-total-count'], 10);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('endpoints.unableToRetriveEndpoints'));
      }

      this.refreshing = false;
    },

    debouncedRefreshCredentials: debounce(
      function debouncedRefreshCredentials() { this.refreshCredentials(); },
      250,
    ),
  },
};
</script>

<style scoped>
.tree-header {
  display: flex;
  padding: 8px;
  font-weight: bold;
  font-size: 0.85em;
  gap: 1rem;
}
</style>
