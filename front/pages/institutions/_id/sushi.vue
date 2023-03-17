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
      @update="onSushiUpdate"
    />

    <SushiHistory ref="sushiHistory" />
    <SushiFiles v-if="isAdmin" ref="sushiFiles" />
    <ReportsDialog ref="reportsDialog" @editItem="editSushiItem" />
    <ConfirmDialog ref="confirm" />

    <v-menu nudge-width="100" style="z-index:100" top offset-y>
      <template #activator="{ on, attrs }">
        <v-slide-y-reverse-transition>
          <v-btn
            v-show="hasSelection"
            fixed
            bottom
            right
            large
            color="primary"
            style="z-index:50; transition: bottom .3s ease"
            :style="hasSnackMessages && 'bottom:70px'"
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

        <v-list-item :disabled="deleting || locked" @click="deleteSushiItems">
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
      <template #top="{ originalItemsLength }">
        <v-toolbar flat>
          <v-toolbar-title>
            {{ $t('institutions.sushi.title', { total: originalItemsLength }) }}
          </v-toolbar-title>

          <v-spacer />

          <v-menu
            v-model="showSushiReadyPopup"
            :close-on-content-click="false"
            bottom
            left
            transition="scale-transition"
            origin="top right"
          >
            <template #activator="{ on }">
              <v-chip
                outlined
                label
                :color="sushiReady ? 'success' : 'secondary'"
                v-on="on"
              >
                <v-progress-circular
                  v-if="loadingSushiReady"
                  indeterminate
                  size="16"
                  width="2"
                />
                <template v-else>
                  <v-icon v-if="sushiReady" left>
                    mdi-checkbox-marked-circle-outline
                  </v-icon>
                  {{
                    sushiReady
                      ? $t('institutions.sushi.entryCompletedOn', { date: sushiReadySince })
                      : $t('institutions.sushi.entryInProgress')
                  }}
                  <v-icon right>
                    mdi-chevron-down
                  </v-icon>
                </template>
              </v-chip>
            </template>

            <v-card width="500">
              <v-card-title>
                {{
                  sushiReady
                    ? $t('institutions.sushi.entryCompleted')
                    : $t('institutions.sushi.entryInProgress')
                }}
              </v-card-title>

              <v-card-text class="text-justify">
                {{
                  sushiReady
                    ? $t('institutions.sushi.readyPopup.completed', { date: sushiReadySince })
                    : $t('institutions.sushi.readyPopup.inProgress')
                }}
              </v-card-text>

              <v-card-actions>
                <v-spacer />

                <v-btn
                  text
                  @click="showSushiReadyPopup = false"
                >
                  {{ $t('close') }}
                </v-btn>

                <v-btn
                  outlined
                  color="primary"
                  :loading="loadingSushiReady"
                  @click="toggleSushiReady"
                >
                  <v-icon left>
                    {{ sushiReady ? 'mdi-text-box-edit-outline' : 'mdi-text-box-check-outline' }}
                  </v-icon>
                  {{
                    $t(`institutions.sushi.${sushiReady ? 'iResumeMyEntry' : 'iCompletedMyEntry'}`)
                  }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-menu>
        </v-toolbar>
      </template>

      <template #expanded-item="{ headers, item }">
        <td />
        <td :colspan="headers.length - 1" class="py-4">
          <SushiDetails :item="item" />
        </td>
      </template>

      <template #item.status="{ item }">
        <SushiConnectionIcon
          :connection="item.connection"
          :loading="loadingItems[item.id]"
          :locked="locked"
          @checkConnection="checkSingleConnection(item)"
        />
      </template>

      <template #item.latestImportTask="{ item }">
        <TaskLabel
          :task="item.latestImportTask"
          @click="showSushiItemHistory(item, { openLatest: true })"
        />
      </template>

      <template #item.latestImportTask.createdAt="{ item }">
        <LocalDate
          v-if="item.latestImportTask"
          :date="item.latestImportTask.createdAt"
          format="Pp"
        />
      </template>

      <template #item.actions="{ item }">
        <v-menu>
          <template #activator="{ on, attrs }">
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
            <template
              v-for="(action, index) in itemActions"
            >
              <v-divider
                v-if="action.divider"
                :key="index"
              />
              <v-list-item
                v-else
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
            </template>
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
import ToolBar from '~/components/space/ToolBar.vue';
import SushiDetails from '~/components/SushiDetails.vue';
import SushiConnectionIcon from '~/components/SushiConnectionIcon.vue';
import SushiForm from '~/components/SushiForm.vue';
import SushiHistory from '~/components/SushiHistory.vue';
import SushiFiles from '~/components/SushiFiles.vue';
import ReportsDialog from '~/components/ReportsDialog.vue';
import ConfirmDialog from '~/components/ConfirmDialog.vue';
import LocalDate from '~/components/LocalDate.vue';
import TaskLabel from '~/components/TaskLabel.vue';

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
    SushiDetails,
    SushiConnectionIcon,
    SushiForm,
    SushiHistory,
    SushiFiles,
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
      showSushiReadyPopup: false,
      loadingSushiReady: false,
      loadingItems: {},
      locked: lockStatus?.locked && !$auth.hasScope('superuser'),
      lockReason: lockStatus?.reason,
    };
  },
  computed: {
    isAdmin() {
      return this.$auth.hasScope('superuser') || this.$auth.hasScope('admin');
    },
    hasSnackMessages() {
      const messages = this.$store?.state?.snacks?.messages;
      return Array.isArray(messages) && messages.length >= 1;
    },
    sushiReady() {
      return !!this.sushiReadySince;
    },
    sushiReadySince() {
      if (!this.institution?.sushiReadySince) { return null; }

      const localDate = new Date(this.institution?.sushiReadySince);

      if (!this.$dateFunctions.isValid(localDate)) {
        return null;
      }

      return this.$dateFunctions.format(localDate, 'P');
    },
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
      return this.sushiItems.filter((item) => (typeof item?.connection?.success !== 'boolean'));
    },
    testingConnection() {
      return Object.keys(this.loadingItems).length > 0;
    },
    itemActions() {
      const actions = [
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
          icon: 'mdi-delete',
          label: this.$t('delete'),
          callback: this.deleteSushiItem,
          disabled: this.deleting,
        },
        {
          divider: true,
        },
        {
          icon: 'mdi-file-search',
          label: this.$t('reports.availableReports'),
          callback: this.showAvailableReports,
        },
        {
          icon: 'mdi-file-tree',
          label: this.$t('sushi.showFiles'),
          callback: this.showSushiItemFiles,
          onlyAdmin: true,
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

      return actions.filter((action) => this.isAdmin || !action.onlyAdmin);
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
    showSushiItemFiles(item) {
      this.$refs.sushiFiles.showFiles(item);
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

    async onSushiUpdate() {
      this.refreshSushiItems();

      if (this.sushiReady) {
        const resumeEntry = await this.$refs.confirm.open({
          title: this.$t('institutions.sushi.resumeEntryQuestion'),
          message: this.$t('institutions.sushi.resumeEntryDesc', { date: this.sushiReadySince }),
          agreeText: this.$t('yes'),
          disagreeText: this.$t('no'),
        });

        if (resumeEntry) {
          this.toggleSushiReady();
        }
      }
    },

    async toggleSushiReady() {
      this.loadingSushiReady = true;
      this.showSushiReadyPopup = false;

      const sushiReadySince = this.institution?.sushiReadySince ? null : new Date();

      try {
        const data = await this.$axios.$put(`/institutions/${this.institution.id}`, { sushiReadySince });
        this.$set(this.institution, 'sushiReadySince', data?.sushiReadySince);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('errors.generic'));
      }

      this.loadingSushiReady = false;
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

    async deleteSushiItem(item) {
      await this.deleteSushiItems([item]);
    },

    async deleteSushiItems(selection) {
      if (!Array.isArray(selection) && !this.hasSelection) {
        return;
      }

      const selected = Array.isArray(selection) ? selection : this.selected;

      const confirmDelete = await this.$refs.confirm.open({
        title: this.$t('areYouSure'),
        message: this.$t('sushi.deleteNbCredentials', { number: selected.length }),
        agreeText: this.$t('delete'),
        disagreeText: this.$t('cancel'),
      });

      if (!confirmDelete) {
        return;
      }

      this.deleting = true;

      const ids = selected.map((select) => select.id);
      let response;

      try {
        response = await this.$axios.$post('/sushi/batch_delete', { ids });
        if (!Array.isArray(response)) {
          throw new Error('invalid response');
        }
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('cannotDeleteItems', { count: selected.length }));
        this.deleting = false;
        return;
      }

      this.deleting = false;

      const failed = response.filter((item) => item?.status !== 'deleted');
      const deleted = response.filter((item) => item?.status === 'deleted');

      failed.forEach(({ id }) => {
        this.$store.dispatch('snacks/error', this.$t('cannotDeleteItem', { id }));
      });

      if (deleted.length > 0) {
        this.$store.dispatch('snacks/success', this.$t('itemsDeleted', { count: deleted.length }));

        const removeDeleted = ({ id }) => !deleted.some((item) => item.id === id);
        this.sushiItems = this.sushiItems.filter(removeDeleted);
        this.selected = this.selected.filter(removeDeleted);
      }
    },
  },
};
</script>
