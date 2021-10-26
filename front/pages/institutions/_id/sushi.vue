<template>
  <section>
    <ToolBar
      :title="toolbarTitle"
      :dark="hasSelection"
    >
      <template v-if="hasSelection" v-slot:nav-icon>
        <v-btn icon @click="clearSelection">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>

      <template v-if="hasSelection" v-slot:default>
        <v-spacer />

        <v-btn text @click="deleteData">
          <v-icon left>
            mdi-delete
          </v-icon>
          {{ $t('delete') }}
        </v-btn>
      </template>

      <template v-else v-slot:default>
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
      </template>
    </ToolBar>

    <v-container>
      <div>{{ $t('institutions.sushi.pageDescription') }}</div>
      <div><strong>{{ $t('institutions.sushi.pageDescription2') }}</strong></div>
    </v-container>

    <SushiForm
      ref="sushiForm"
      :platforms="platforms"
      @update="refreshSushiItems"
    />

    <SushiHistory ref="sushiHistory" />
    <ReportsDialog ref="reportsDialog" @editItem="editSushiItem" />

    <v-data-table
      v-if="hasInstitution"
      v-model="selected"
      :headers="headers"
      :items="sushiItems"
      :loading="refreshing"
      :search="search"
      :items-per-page="15"
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

      <template v-slot:item.latestImportTask="{ item }">
        <TaskLabel
          :task="item.latestImportTask"
          @click="showSushiItemHistory(item, { openLatest: true })"
        />
      </template>

      <template v-slot:item.latestImportTask.createdAt="{ item }">
        <LocalDate v-if="item.latestImportTask" :date="item.latestImportTask.createdAt" />
      </template>

      <template v-slot:item.actions="{ item }">
        <v-menu>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              small
              color="primary"
              v-bind="attrs"
              v-on="on"
            >
              {{ $t('actions') }}
              <v-icon right>
                mdi-menu-down
              </v-icon>
            </v-btn>
          </template>

          <v-list>
            <v-list-item
              v-for="action in itemActions"
              :key="action.icon"
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
import SushiForm from '~/components/SushiForm';
import SushiHistory from '~/components/SushiHistory';
import ReportsDialog from '~/components/ReportsDialog';
import LocalDate from '~/components/LocalDate';
import TaskLabel from '~/components/TaskLabel';

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
    SushiDetails,
    SushiForm,
    SushiHistory,
    ReportsDialog,
    LocalDate,
    TaskLabel,
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

    let platforms = [];
    try {
      platforms = await $axios.$get('/sushi/platforms.json');
    } catch (e) {
      store.dispatch('snacks/error', app.i18n.t('institutions.unableToRetrivePlatforms'));
    }

    return {
      institution,
      sushiItems: [],
      selected: [],
      refreshing: false,
      search: '',
      platforms,
    };
  },
  computed: {
    headers() {
      return [
        {
          text: this.$t('institutions.sushi.platform'),
          value: 'vendor',
        },
        {
          text: this.$t('institutions.sushi.package'),
          value: 'package',
          align: 'right',
          width: '200px',
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
          text: this.$t('sushi.latestImport'),
          value: 'latestImportTask.createdAt',
          align: 'right',
          width: '220px',
        },
        {
          text: '',
          value: 'actions',
          sortable: false,
          width: '150px',
          align: 'right',
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
    toolbarTitle() {
      if (this.hasSelection) {
        return this.$t('nSelected', { count: this.selected.length });
      }

      return this.institutionName;
    },
    itemActions() {
      return [
        {
          icon: 'mdi-pencil',
          label: this.$t('modify'),
          callback: this.editSushiItem,
        },
        {
          icon: 'mdi-content-copy',
          label: this.$t('duplicate'),
          callback: this.duplicateItem,
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

    async deleteData() {
      if (!this.hasSelection) {
        return;
      }

      const ids = this.selected.map(select => select.id);
      let response;

      try {
        response = await this.$axios.$post('/sushi/batch_delete', { ids });
        if (!Array.isArray(response)) {
          throw new Error('invalid response');
        }
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('cannotDeleteItems', { count: this.selected.length }));
        return;
      }

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
