<template>
  <section>
    <ToolBar :title="institutionName">
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

      <v-btn
        v-if="hasInstitution"
        color="primary"
        text
        :loading="refreshing"
        @click.stop="refreshSushiItems"
      >
        <v-icon left>
          mdi-refresh
        </v-icon>
        {{ $t('refresh') }}
      </v-btn>

      <v-btn
        v-if="hasInstitution"
        color="primary"
        text
        @click.stop="createSushiItem"
      >
        <v-icon left>
          mdi-key-plus
        </v-icon>
        {{ $t('add') }}
      </v-btn>
    </ToolBar>

    <v-container fluid>
      <div>{{ $t('institutions.sushi.pageDescription') }}</div>
      <div><strong>{{ $t('institutions.sushi.pageDescription2') }}</strong></div>

      <v-row v-if="locked" justify="center" class="mt-2">
        <v-col style="max-width: 900px">
          <v-alert
            outlined
            type="info"
            prominent
            icon="mdi-lock"
          >
            <div class="text-h6" v-text="$t('sushi.managementIsLocked')" />
            <div v-if="lockReason" v-text="$t('reason', { reason: lockReason })" />
          </v-alert>
        </v-col>
      </v-row>

      <v-row v-if="hasUntestedItems" justify="center" class="mt-2">
        <v-col style="max-width: 1000px">
          <v-alert
            outlined
            type="info"
            prominent
            icon="mdi-bell-alert"
          >
            <div v-if="lockReason" v-text="$t('reason', { reason: lockReason })" />
            <v-row align="center">
              <v-col class="grow">
                <div
                  class="text-h6"
                  v-text="$tc('sushi.youHaveUntestedCredentials', untestedItems.length)"
                />
              </v-col>
              <v-col class="shrink">
                <v-btn
                  color="info"
                  :loading="testingConnection"
                  @click="checkUntestedItems"
                >
                  {{ $t('institutions.sushi.checkConnection') }}
                </v-btn>
              </v-col>
            </v-row>
          </v-alert>
        </v-col>
      </v-row>
    </v-container>

    <SushiForm
      ref="sushiForm"
      :endpoints="endpoints"
      @update="refreshSushiItems"
    />

    <SushiHistory ref="sushiHistory" />
    <ReportsDialog ref="reportsDialog" @editItem="editSushiItem" />
    <ConfirmDialog ref="confirm" />

    <v-menu nudge-width="100" style="z-index:100">
      <template v-slot:activator="{ on, attrs }">
        <v-slide-y-reverse-transition>
          <v-btn
            v-show="hasSelection"
            fixed
            bottom
            right
            large
            color="primary"
            style="z-index:50"
            v-bind="attrs"
            v-on="on"
          >
            {{ $tc('institutions.sushi.manageNcredentials', selected.length) }}
            <v-icon right>
              mdi-chevron-down
            </v-icon>
          </v-btn>
        </v-slide-y-reverse-transition>
      </template>

      <v-list>
        <v-list-item :disabled="testingConnection || locked" @click="checkMultipleConnection">
          <v-list-item-icon>
            <v-icon>mdi-connection</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title v-text="$t('institutions.sushi.checkConnection')" />
          </v-list-item-content>
        </v-list-item>

        <v-list-item :disabled="deleting || locked" @click="deleteData">
          <v-list-item-icon>
            <v-icon>mdi-delete</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title v-text="$t('delete')" />
          </v-list-item-content>
        </v-list-item>

        <v-list-item @click="clearSelection">
          <v-list-item-icon>
            <v-icon>mdi-close</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title v-text="$t('deselect')" />
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-data-table
      v-if="hasInstitution"
      v-model="selected"
      :headers="headers"
      :items="sushiItems"
      :loading="refreshing"
      :search="search"
      :items-per-page="50"
      :footer-props="{ itemsPerPageOptions: [10, 20, 50, -1] }"
      show-select
      show-expand
      single-expand
      item-key="id"
      sort-by="vendor"
    >
      <template v-slot:top="{ originalItemsLength }">
        <v-toolbar flat>
          <v-toolbar-title>
            {{ $t('institutions.sushi.title', { total: originalItemsLength }) }}
          </v-toolbar-title>
        </v-toolbar>
      </template>

      <template v-slot:expanded-item="{ headers, item }">
        <td />
        <td :colspan="headers.length - 1" class="py-4">
          <SushiDetails :item="item" />
        </td>
      </template>

      <template v-slot:item.status="{ item }">
        <SushiConnectionIcon
          :connection="item.connection"
          :loading="loadingItems[item.id]"
          :locked="locked"
          @checkConnection="checkSingleConnection(item)"
        />
      </template>

      <template v-slot:item.latestImportTask="{ item }">
        <TaskLabel
          :task="item.latestImportTask"
          @click="showSushiItemHistory(item, { openLatest: true })"
        />
      </template>

      <template v-slot:item.latestImportTask.createdAt="{ item }">
        <LocalDate
          v-if="item.latestImportTask"
          :date="item.latestImportTask.createdAt"
          format="Pp"
        />
      </template>

      <template v-slot:item.actions="{ item }">
        <v-menu>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              icon
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>
                mdi-cog
              </v-icon>
            </v-btn>
          </template>

          <v-list>
            <v-list-item
              v-for="action in itemActions"
              :key="action.icon"
              :disabled="action.disabled"
              @click="action.callback(item)"
            >
              <v-list-item-icon>
                <v-icon>{{ action.icon }}</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title v-text="action.label" />
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>

    <v-card v-else tile flat color="transparent">
      <v-card-text>
        <div class="mb-2" v-text="$t('institutions.notAttachedToAnyInstitution')" />
        <a :href="'/info/institution'" v-text="$t('institutions.reportInstitutionInformation')" />
      </v-card-text>
    </v-card>
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar';
import SushiDetails from '~/components/SushiDetails';
import SushiConnectionIcon from '~/components/SushiConnectionIcon';
import SushiForm from '~/components/SushiForm';
import SushiHistory from '~/components/SushiHistory';
import ReportsDialog from '~/components/ReportsDialog';
import ConfirmDialog from '~/components/ConfirmDialog';
import LocalDate from '~/components/LocalDate';
import TaskLabel from '~/components/TaskLabel';

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
    SushiDetails,
    SushiConnectionIcon,
    SushiForm,
    SushiHistory,
    ReportsDialog,
    LocalDate,
    TaskLabel,
    ConfirmDialog,
  },
  async asyncData({
    $axios,
    store,
    params,
    app,
    $auth,
    redirect,
  }) {
    let institution = null;
    let lockStatus;

    if (!$auth.hasScope('superuser') && !$auth.hasScope('sushi_form')) {
      return redirect({ name: 'myspace' });
    }

    try {
      institution = await $axios.$get(`/institutions/${params.id}`);
    } catch (e) {
      if (e.response?.status === 404) {
        institution = {};
      } else {
        store.dispatch('snacks/error', app.i18n.t('institutions.unableToRetriveInformations'));
      }
    }

    try {
      lockStatus = await $axios.$get('/sushi/_lock');
    } catch (e) {
      store.dispatch('snacks/error', app.i18n.t('sushi.unableToGetLockStatus'));
    }

    let endpoints = [];
    try {
      endpoints = await $axios.$get('/sushi-endpoints');
    } catch (e) {
      store.dispatch('snacks/error', app.i18n.t('institutions.unableToRetrivePlatforms'));
    }

    return {
      institution,
      sushiItems: [],
      selected: [],
      refreshing: false,
      deleting: false,
      search: '',
      endpoints,
      loadingItems: {},
      locked: lockStatus?.locked && !$auth.hasScope('superuser'),
      lockReason: lockStatus?.reason,
    };
  },
  computed: {
    headers() {
      return [
        {
          text: this.$t('status'),
          value: 'status',
          align: 'center',
          width: '100px',
        },
        {
          text: this.$t('institutions.sushi.label'),
          value: 'vendor',
        },
        {
          text: this.$t('institutions.sushi.package'),
          value: 'package',
          align: 'right',
          width: '200px',
        },
        {
          text: this.$t('sushi.latestImport'),
          value: 'latestImportTask.createdAt',
          align: 'right',
          width: '160px',
        },
        {
          text: this.$t('type'),
          value: 'latestImportTask.params.reportType',
          align: 'right',
          width: '80px',
          cellClass: 'text-uppercase',
        },
        {
          text: this.$t('sushi.importState'),
          value: 'latestImportTask',
          align: 'right',
          width: '200px',
          sort: (a, b) => {
            if (a?.status === b?.status) { return 0; }
            if (a?.status === 'finished') { return 1; }
            if (b?.status === 'finished') { return -1; }
            if (typeof a?.status !== 'string') { return -1; }
            if (typeof b?.status !== 'string') { return 1; }
            return a?.status > b?.status ? 1 : -1;
          },
        },
        {
          text: this.$t('actions'),
          value: 'actions',
          sortable: false,
          width: '85px',
          align: 'center',
        },
      ];
    },
    hasInstitution() {
      return !!this.institution?.id;
    },
    institutionName() {
      return this.institution?.name;
    },
    hasSelection() {
      return this.selected.length > 0;
    },
    hasUntestedItems() {
      return this.untestedItems.length > 0;
    },
    untestedItems() {
      return this.sushiItems.filter(item => (typeof item?.connection?.success !== 'boolean'));
    },
    testingConnection() {
      return Object.keys(this.loadingItems).length > 0;
    },
    itemActions() {
      return [
        {
          icon: 'mdi-pencil',
          label: this.$t('modify'),
          callback: this.editSushiItem,
          disabled: this.locked,
        },
        {
          icon: 'mdi-content-copy',
          label: this.$t('duplicate'),
          callback: this.duplicateItem,
          disabled: this.locked,
        },
        {
          icon: 'mdi-file-search',
          label: this.$t('reports.availableReports'),
          callback: this.showAvailableReports,
        },
        {
          icon: 'mdi-history',
          label: this.$t('tasks.history'),
          callback: this.showSushiItemHistory,
        },
        {
          icon: 'mdi-identifier',
          label: this.$t('sushi.copyId'),
          callback: this.copySushiId,
        },
      ];
    },
  },
  mounted() {
    return this.refreshSushiItems();
  },
  methods: {
    async copySushiId(item) {
      if (!navigator.clipboard) {
        this.$store.dispatch('snacks/error', this.$t('sushi.unableToCopyId'));
        return;
      }

      try {
        await navigator.clipboard.writeText(item.id);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('sushi.unableToCopyId'));
        return;
      }

      this.$store.dispatch('snacks/info', this.$t('sushi.idCopied'));
    },
    showAvailableReports(item) {
      this.$refs.reportsDialog.showReports(item);
    },
    createSushiItem() {
      this.$refs.sushiForm.createSushiItem(this.institution);
    },
    editSushiItem(item) {
      this.$refs.sushiForm.editSushiItem(this.institution, item);
    },
    duplicateItem(item) {
      this.$refs.sushiForm.editSushiItem(this.institution, { ...item, id: undefined });
    },
    showSushiItemHistory(item, opts = {}) {
      this.$refs.sushiHistory.showSushiItem(item, opts);
    },
    async refreshSushiItems() {
      if (!this.hasInstitution) { return; }

      this.refreshing = true;

      try {
        this.sushiItems = await this.$axios.$get(`/institutions/${this.institution.id}/sushi`, {
          params: {
            latestImportTask: true,
          },
        });
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('institutions.sushi.unableToRetriveSushiData'));
      }

      this.refreshing = false;
    },

    clearSelection() {
      this.selected = [];
    },

    checkUntestedItems() {
      if (this.hasUntestedItems) {
        this.selected = this.untestedItems.slice();
        this.checkMultipleConnection();
      }
    },

    async checkSingleConnection(sushiItem) {
      this.$set(this, 'loadingItems', { [sushiItem.id]: true });

      try {
        this.$set(sushiItem, 'connection', await this.$axios.$get(`/sushi/${sushiItem.id}/connection`));
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('institutions.sushi.cannotCheckConnection', { name: sushiItem.vendor }));
      }

      this.$set(this, 'loadingItems', {});
    },

    async checkMultipleConnection() {
      if (!this.hasSelection) { return; }

      const loadingItems = {};
      const selected = this.selected.slice();

      selected.forEach((s) => {
        loadingItems[s.id] = true;
      });

      this.$set(this, 'loadingItems', loadingItems);
      this.clearSelection();

      for (let i = 0; i < selected.length; i += 1) {
        const sushiItem = selected[i];

        try {
          // eslint-disable-next-line no-await-in-loop
          this.$set(sushiItem, 'connection', await this.$axios.$get(`/sushi/${sushiItem.id}/connection`));
        } catch (e) {
          this.$store.dispatch('snacks/error', this.$t('institutions.sushi.cannotCheckConnection', { name: sushiItem.vendor }));
        }

        this.loadingItems[sushiItem.id] = false;
      }

      this.$set(this, 'loadingItems', {});
    },

    async deleteData() {
      if (!this.hasSelection) {
        return;
      }

      const deleteData = await this.$refs.confirm.open({
        title: this.$t('areYouSure'),
        message: this.$t('sushi.deleteNbCredentials', { number: this.selected.length }),
        agreeText: this.$t('delete'),
        disagreeText: this.$t('cancel'),
      });

      if (!deleteData) {
        return;
      }

      this.deleting = true;

      const ids = this.selected.map(select => select.id);
      let response;

      try {
        response = await this.$axios.$post('/sushi/batch_delete', { ids });
        if (!Array.isArray(response)) {
          throw new Error('invalid response');
        }
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('cannotDeleteItems', { count: this.selected.length }));
        this.deleting = false;
        return;
      }

      this.deleting = false;

      const failed = response.filter(item => item?.status !== 'deleted');
      const deleted = response.filter(item => item?.status === 'deleted');

      failed.forEach(({ id }) => {
        this.$store.dispatch('snacks/error', this.$t('cannotDeleteItem', { id }));
      });

      if (deleted.length > 0) {
        this.$store.dispatch('snacks/success', this.$t('itemsDeleted', { count: deleted.length }));

        const removeDeleted = ({ id }) => !deleted.some(item => item.id === id);
        this.sushiItems = this.sushiItems.filter(removeDeleted);
        this.selected = this.selected.filter(removeDeleted);
      }
    },
  },
};
</script>
