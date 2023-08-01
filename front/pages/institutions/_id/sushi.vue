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
        v-if="canEdit"
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
            <div class="text-h6">
              {{ $t('sushi.managementIsLocked') }}
            </div>

            <div v-if="lockReason">
              {{ $t('reason', { reason: lockReason }) }}
            </div>
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
        <v-list-item :disabled="deleting || locked || !canDelete" @click="deleteSushiItems">
          <v-list-item-icon>
            <v-icon>mdi-delete</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ $t('delete') }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item @click="clearSelection">
          <v-list-item-icon>
            <v-icon>mdi-close</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ $t('deselect') }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-data-table
      v-if="hasInstitution"
      v-model="selected"
      :headers="tableHeaders"
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

      <template #[`item.updatedAt`]="{ item }">
        <LocalDate :date="item.updatedAt" />
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

      <template #[`item.actions`]="{ item }">
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
                  <v-list-item-title>
                    {{ action.label }}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </template>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>

    <v-card v-else tile flat color="transparent">
      <v-card-text>
        <div class="mb-2">
          {{ $t('institutions.notAttachedToAnyInstitution') }}
        </div>

        <a :href="'/info/institution'">
          {{ $t('institutions.reportInstitutionInformation') }}
        </a>
      </v-card-text>
    </v-card>
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar.vue';
import SushiDetails from '~/components/SushiDetails.vue';
import SushiForm from '~/components/SushiForm.vue';
import SushiHistory from '~/components/SushiHistory.vue';
import SushiFiles from '~/components/SushiFiles.vue';
import ReportsDialog from '~/components/ReportsDialog.vue';
import ConfirmDialog from '~/components/ConfirmDialog.vue';
import LocalDate from '~/components/LocalDate.vue';

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
    SushiDetails,
    SushiForm,
    SushiHistory,
    SushiFiles,
    ReportsDialog,
    ConfirmDialog,
    LocalDate,
  },
  async asyncData({
    $axios,
    store,
    params,
    app,
    $auth,
  }) {
    let institution = null;
    let lockStatus;

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
      return this.$auth.user?.isAdmin;
    },
    userPermissions() {
      const membership = this.$auth.user?.memberships?.find(
        (m) => m?.institutionId === this.institution?.id,
      );
      return new Set(membership?.permissions);
    },
    canEdit() {
      return this.isAdmin || this.userPermissions.has('sushi:write');
    },
    canDelete() {
      return this.isAdmin || this.userPermissions.has('sushi:delete');
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
    tableHeaders() {
      return [
        {
          text: this.$t('institutions.sushi.endpoint'),
          value: 'endpoint.vendor',
          sort: (a, b) => {
            const vendor1 = a?.endpoint?.vendor?.toLowercase();
            const vendor2 = b?.endpoint?.vendor?.toLowercase();

            return vendor1 > vendor2 ? 1 : -1;
          },
        },
        {
          text: this.$t('institutions.sushi.tags'),
          value: 'tags',
          align: 'right',
          width: 'auto',
        },
        {
          text: this.$t('institutions.sushi.updatedAt'),
          value: 'updatedAt',
          align: 'right',
          width: '230px',
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
    itemActions() {
      const actions = [
        {
          icon: 'mdi-pencil',
          label: this.$t('modify'),
          callback: this.editSushiItem,
          disabled: this.locked || !this.canEdit,
        },
        {
          icon: 'mdi-content-copy',
          label: this.$t('duplicate'),
          callback: this.duplicateItem,
          disabled: this.locked || !this.canEdit,
        },
        {
          icon: 'mdi-delete',
          label: this.$t('delete'),
          callback: this.deleteSushiItem,
          disabled: this.deleting || !this.canDelete,
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
          hide: !this.isAdmin,
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

      return actions.filter((action) => !action.hide);
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
        this.sushiItems = await this.$axios.$get(`/institutions/${this.institution.id}/sushi`);
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

      const deleted = [];
      const failed = [];

      const requests = selected.map(async (item) => {
        try {
          await this.$axios.$delete(`/sushi/${item.id}`);
          deleted.push(item);
        } catch (e) {
          failed.push(item);
        }
      });

      await Promise.allSettled(requests);

      failed.forEach((item) => {
        this.$store.dispatch('snacks/error', this.$t('cannotDeleteItem', { id: item?.endpoint?.vendor || item?.id }));
      });

      if (failed.length > 0) {
        this.$store.dispatch('snacks/error', this.$t('cannotDeleteItems', { count: failed.length }));
      }
      if (deleted.length > 0) {
        this.$store.dispatch('snacks/success', this.$t('itemsDeleted', { count: deleted.length }));
      }

      this.refreshSushiItems();
      this.deleting = false;
    },
  },
};
</script>
