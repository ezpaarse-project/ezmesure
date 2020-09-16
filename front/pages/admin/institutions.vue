<template>
  <section>
    <ToolBar title="Établissements">
      <slot>
        <v-spacer />

        <v-btn text @click="refreshInstitutions">
          <v-icon left>
            mdi-refresh
          </v-icon>
          {{ $t('refresh') }}
        </v-btn>
      </slot>
    </ToolBar>

    <v-data-table
      v-model="selected"
      :headers="headers"
      :items="institutions"
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
        <v-tooltip bottom :open-delay="500">
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs" small icon :href="`/institutions/${item.id}/sushi`" v-on="on"
            >
              <v-icon small>
                mdi-key
              </v-icon>
            </v-btn>
          </template>
          <span v-text="$t('institutions.sushi.credentials')" />
        </v-tooltip>

        <v-tooltip bottom :open-delay="500">
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs" small icon :href="`/institutions/${item.id}/members`" v-on="on"
            >
              <v-icon small>
                mdi-account-multiple
              </v-icon>
            </v-btn>
          </template>
          <span v-text="$t('institutions.members.members')" />
        </v-tooltip>

        <v-tooltip bottom :open-delay="500">
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs" small icon @click="editInstitution(item)" v-on="on"
            >
              <v-icon small>
                mdi-pencil
              </v-icon>
            </v-btn>
          </template>
          <span v-text="$t('modify')" />
        </v-tooltip>

        <ValidationPopup
          :institution-id="item.id"
          @change="validated => item.validated = validated"
        />
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
import ValidationPopup from '~/components/ValidationPopup';

export default {
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ToolBar,
    InstitutionForm,
    ValidationPopup,
  },
  data() {
    return {
      selected: [],
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
      try {
        this.institutions = await this.$axios.$get('/institutions');
      } catch (e) {
        this.$store.dispatch('snacks/error', this.$t('institutions.unableToRetriveInformations'));
      }

      if (!Array.isArray(this.institutions)) {
        this.institutions = [];
      }
    },
    editInstitution(item) {
      this.$refs.institutionForm.editInstitution(item);
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
  },
};
</script>
