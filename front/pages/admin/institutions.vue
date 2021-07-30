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

        <v-btn text @click="deleteInstitutions">
          <v-icon left>
            mdi-delete
          </v-icon>
          {{ $t('delete') }}
        </v-btn>
      </template>


      <template v-else v-slot:default>
        <v-spacer />

        <v-btn text @click="createInstitution">
          <v-icon left>
            mdi-plus
          </v-icon>
          {{ $t('add') }}
        </v-btn>
        <v-btn text :loading="refreshing" @click="refreshInstitutions">
          <v-icon left>
            mdi-refresh
          </v-icon>
          {{ $t('refresh') }}
        </v-btn>

        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          :label="$t('search')"
          solo
          dense
          hide-details
          style="max-width: 200px"
        />
      </template>
    </ToolBar>

    <v-data-table
      v-model="selected"
      :headers="headers"
      :items="institutions"
      :search="search"
      :loading="refreshing"
      sort-by="name"
      item-key="id"
      show-select
    >
      <template v-slot:item.name="{ item }">
        <nuxt-link :to="`/institutions/${item.id}`">
          {{ item.name }}
        </nuxt-link>
      </template>

      <template v-slot:item.automatisations="{ item }">
        <v-chip
          label
          small
          :outlined="!item.auto.ezpaarse"
          :text-color="item.auto.ezpaarse ? 'white' : 'grey'"
          :color="item.auto.ezpaarse ? 'green' : 'grey'"
        >
          ezPAARSE
        </v-chip>
        <v-chip
          label
          small
          :outlined="!item.auto.ezmesure"
          :text-color="item.auto.ezmesure ? 'white' : 'grey'"
          :color="item.auto.ezmesure ? 'green' : 'grey'"
        >
          ezMESURE
        </v-chip>
        <v-chip
          label
          small
          :outlined="!item.auto.report"
          :text-color="item.auto.report ? 'white' : 'grey'"
          :color="item.auto.report ? 'green' : 'grey'"
        >
          Reporting
        </v-chip>
      </template>

      <template v-slot:item.status="{ item }">
        <v-chip
          label
          small
          :color="item.validated ? 'success' : 'default'"
          outlined
        >
          <span v-if="item.validated" v-text="$t('institutions.institution.validated')" />
          <span v-else v-text="$t('institutions.institution.notValidated')" />
        </v-chip>
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
            <v-list-item @click="editInstitution(item)">
              <v-list-item-icon>
                <v-icon>mdi-pencil</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title v-text="$t('modify')" />
              </v-list-item-content>
            </v-list-item>

            <v-list-item :href="`/institutions/${item.id}/sushi`">
              <v-list-item-icon>
                <v-icon>mdi-key</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title v-text="$t('institutions.sushi.credentials')" />
              </v-list-item-content>
            </v-list-item>

            <v-list-item :href="`/institutions/${item.id}/members`">
              <v-list-item-icon>
                <v-icon>mdi-account-multiple</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title v-text="$t('institutions.members.members')" />
              </v-list-item-content>
            </v-list-item>

            <v-list-item @click="copyInstitutionId(item)">
              <v-list-item-icon>
                <v-icon>mdi-identifier</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title v-text="$t('copyId')" />
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>

    <InstitutionForm ref="institutionForm" @update="refreshInstitutions" />
    <InstitutionsDeleteDialog ref="deleteDialog" @removed="onInstitutionsRemove" />
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar';
import InstitutionForm from '~/components/InstitutionForm';
import InstitutionsDeleteDialog from '~/components/InstitutionsDeleteDialog';

export default {
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ToolBar,
    InstitutionForm,
    InstitutionsDeleteDialog,
  },
  data() {
    return {
      selected: [],
      search: '',
      refreshing: false,
      types: ['tech', 'doc'],
      logo: null,
      logoPreview: null,
      institutions: [],
    };
  },
  mounted() {
    return this.refreshInstitutions();
  },
  computed: {
    hasSelection() {
      return this.selected.length > 0;
    },
    toolbarTitle() {
      if (this.hasSelection) {
        return this.$t('nSelected', { count: this.selected.length });
      }
      return this.$t('menu.institutions');
    },
    headers() {
      return [
        { text: this.$t('institutions.title'), value: 'name' },
        { text: 'Index', value: 'index.prefix' },
        { text: 'ECs', value: 'index.count' },
        { text: this.$t('institutions.institution.automations'), value: 'automatisations' },
        {
          text: this.$t('institutions.institution.status'),
          value: 'status',
          width: '150px',
        },
        {
          text: this.$t('actions'),
          value: 'actions',
          sortable: false,
          width: '170px',
          align: 'center',
        },
      ];
    },
  },
  methods: {
    async refreshInstitutions() {
      this.refreshing = true;

      try {
        this.institutions = await this.$axios.$get('/institutions');
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('institutions.unableToRetriveInformations'));
      }

      if (!Array.isArray(this.institutions)) {
        this.institutions = [];
      }

      this.refreshing = false;
    },
    editInstitution(item) {
      this.$refs.institutionForm.editInstitution(item);
    },
    createInstitution() {
      this.$refs.institutionForm.createInstitution({ saveCreator: false });
    },
    onInstitutionsRemove(removedIds) {
      const removeDeleted = institution => !removedIds.some(id => institution.id === id);
      this.institutions = this.institutions.filter(removeDeleted);
      this.selected = this.selected.filter(removeDeleted);
    },
    async copyInstitutionId(item) {
      if (!navigator.clipboard) {
        this.$store.dispatch('snacks/error', this.$t('unableToCopyId'));
        return;
      }
      try {
        await navigator.clipboard.writeText(item.id);
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('unableToCopyId'));
        return;
      }
      this.$store.dispatch('snacks/info', this.$t('idCopied'));
    },
    deleteInstitutions() {
      this.$refs.deleteDialog.confirmDelete(this.selected);
    },
    clearSelection() {
      this.selected = [];
    },
  },
};
</script>
