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

    <SushiForm
      ref="sushiForm"
      :platforms="platforms"
      @update="refreshSushiItems"
    />

    <SushiHistory ref="sushiHistory" />
    <ReportsDialog ref="reportsDialog" />

    <v-data-table
      v-if="hasInstitution"
      v-model="selected"
      :headers="headers"
      :items="sushiItems"
      :loading="refreshing"
      :search="search"
      show-select
      item-key="id"
    >
      <template v-slot:item.actions="{ item }">
        <v-icon
          small
          @click="editSushiItem(item)"
        >
          mdi-pencil
        </v-icon>

        <v-icon
          small
          @click="showAvailableReports(item)"
        >
          mdi-file-search
        </v-icon>

        <v-icon
          small
          @click="showSushiItemHistory(item)"
        >
          mdi-history
        </v-icon>
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
import SushiForm from '~/components/SushiForm';
import SushiHistory from '~/components/SushiHistory';
import ReportsDialog from '~/components/ReportsDialog';

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
    SushiForm,
    SushiHistory,
    ReportsDialog,
  },
  async asyncData({
    $axios,
    store,
    params,
    app,
  }) {
    let institution = null;

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
      headers: [
        {
          text: app.i18n.t('institutions.sushi.platform'),
          value: 'vendor',
        },
        {
          text: app.i18n.t('institutions.sushi.package'),
          value: 'package',
          align: 'right',
          width: '200px',
        },
        {
          text: 'Actions',
          value: 'actions',
          sortable: false,
          width: '100px',
          align: 'right',
        },
      ],
      platforms,
    };
  },
  computed: {
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

      return this.$t('institutions.sushi.title', { institutionName: this.institutionName });
    },
  },
  mounted() {
    return this.refreshSushiItems();
  },
  methods: {
    showAvailableReports(item) {
      this.$refs.reportsDialog.showReports(item);
    },
    createSushiItem() {
      this.$refs.sushiForm.createSushiItem(this.institution);
    },
    editSushiItem(item) {
      this.$refs.sushiForm.editSushiItem(this.institution, item);
    },
    showSushiItemHistory(item) {
      this.$refs.sushiHistory.showSushiItem(item);
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
