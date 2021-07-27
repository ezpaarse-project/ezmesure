<template>
  <section>
    <ToolBar title="Établissements">
      <slot>
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
      </slot>
    </ToolBar>

    <v-data-table
      v-model="selected"
      :headers="headers"
      :items="institutions"
      :search="search"
      :loading="refreshing"
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

      <template v-slot:footer>
        <span v-if="selected.length">
          <v-btn small color="error" class="ma-2" @click="deleteData">
            <v-icon left>mdi-delete</v-icon>
            {{ $t('delete') }} ({{ selected.length }})
          </v-btn>
        </span>
      </template>
    </v-data-table>

    <InstitutionForm ref="institutionForm" @update="refreshInstitutions" />
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar';
import InstitutionForm from '~/components/InstitutionForm';

export default {
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ToolBar,
    InstitutionForm,
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
          text: 'Actions',
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
    async deleteData() {
      if (this.selected.length === 0) {
        return;
      }

      const ids = this.selected.map(select => select.id);
      let response;

      try {
        response = await this.$axios.$post('/institutions/delete', { ids });
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
        this.institutions = this.institutions.filter(removeDeleted);
        this.selected = this.selected.filter(removeDeleted);
      }
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
  },
};
</script>
