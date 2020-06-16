<template>
  <section>
    <ToolBar title="Établissements">
      <slot>
        <v-spacer />

        <v-btn text @click="refreshInstitutions">
          <v-icon left>
            mdi-refresh
          </v-icon>
          Actualiser
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
          <span>Identifiants Sushi</span>
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
          <span>Membres</span>
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
          <span>Modifier</span>
        </v-tooltip>
      </template>

      <template v-slot:footer>
        <span v-if="selected.length">
          <v-btn small color="error" class="ma-2" @click="deleteData">
            <v-icon left>mdi-delete</v-icon>
            Supprimer ({{ selected.length }})
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
      headers: [
        { text: 'Etablissement', value: 'name' },
        { text: 'Index', value: 'index.prefix' },
        { text: 'ECs', value: 'index.count' },
        { text: 'Automatisations', value: 'automatisations' },
        {
          text: 'Actions',
          value: 'actions',
          sortable: false,
          width: '150px',
          align: 'center',
        },
      ],
      types: ['tech', 'doc'],
      logo: null,
      logoPreview: null,
      institutions: [],
    };
  },
  mounted() {
    return this.refreshInstitutions();
  },
  methods: {
    async refreshInstitutions() {
      let institutions;
      try {
        institutions = await this.$axios.$get('/institutions');
      } catch (e) {
        this.$store.dispatch('snacks/error', 'Impossible de récupérer les informations d\'établissement');
      }

      if (!Array.isArray(institutions)) {
        institutions = [];
      }

      institutions.forEach((institution) => {
        institution.location = institution.location || {};
        const users = institution?.contacts?.users;
        const logoUrl = institution?.logoUrl;

        if (Array.isArray(users)) {
          users.filter(u => u.type).forEach((user) => {
            user.type = user.type.split(',');
          });
        }

        institution.logo = null;
        institution.logoPreview = null;

        if (logoUrl) {
          institution.logoPreview = `/api/institutions/pictures/${logoUrl}`;
        }
      });

      this.institutions = institutions;
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
        this.$store.dispatch('snacks/error', `Impossible de supprimer ${this.selected.length} élement(s)`);
        return;
      }

      const failed = response.filter(item => item?.status !== 'deleted');
      const deleted = response.filter(item => item?.status === 'deleted');

      failed.forEach(({ id }) => {
        this.$store.dispatch('snacks/error', `Impossible de supprimer l'établissement ${id}`);
      });


      if (deleted.length > 0) {
        this.$store.dispatch('snacks/success', `${deleted.length} élement(s) supprimé(s)`);

        const removeDeleted = ({ id }) => !deleted.some(item => item.id === id);
        this.institutions = this.institutions.filter(removeDeleted);
        this.selected = this.selected.filter(removeDeleted);
      }
    },
  },
};
</script>
