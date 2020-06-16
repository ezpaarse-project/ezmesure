<template>
  <section>
    <ToolBar :title="`Identifiants Sushi - ${institution.name}`">
      <slot>
        <v-spacer />
        <v-btn
          v-if="hasInstitution"
          color="primary"
          @click.stop="createSushiItem"
        >
          <v-icon left>
            mdi-key-plus
          </v-icon>
          Ajouter
        </v-btn>
      </slot>
    </ToolBar>

    <SushiForm ref="sushiForm" @update="refreshSushiItems" />

    <v-data-table
      v-if="hasInstitution"
      v-model="selected"
      :headers="headers"
      :items="sushiItems"
      :loading="refreshing"
      show-select
      item-key="id"
    >
      <template v-slot:item.name="{ item }">
        {{ item.vendor }}
      </template>

      <template v-slot:item.actions="{ item }">
        <v-icon
          small
          @click="editSushiItem(item)"
        >
          mdi-pencil
        </v-icon>
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

    <v-card v-else tile flat color="transparent">
      <v-card-text>
        <div class="mb-2">
          Vous n'êtes rattachés à aucun établissement,
          où vous n'avez déclaré aucunes informations sur votre établissement.
        </div>
        <a :href="'/info/institution'">
          Déclarer des informations d'établissement.
        </a>
      </v-card-text>
    </v-card>
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar';
import SushiForm from '~/components/SushiForm';

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
    SushiForm,
  },
  async asyncData({ $axios, store, params }) {
    let institution = null;

    try {
      institution = await $axios.$get(`/institutions/${params.id}`);
    } catch (e) {
      if (e.response?.status === 404) {
        institution = {};
      } else {
        store.dispatch('snacks/error', 'Impossible de récupérer les informations d\'établissement');
      }
    }

    return {
      institution,
      sushiItems: [],
      selected: [],
      refreshing: false,
      headers: [
        {
          text: 'Libellé',
          value: 'name',
        },
        {
          text: 'Actions',
          value: 'actions',
          sortable: false,
          width: '100px',
          align: 'right',
        },
      ],
    };
  },
  computed: {
    hasInstitution() {
      return !!this.institution?.id;
    },
  },
  mounted() {
    return this.refreshSushiItems();
  },
  methods: {
    createSushiItem() {
      this.$refs.sushiForm.createSushiItem(this.institution.id);
    },
    editSushiItem(item) {
      this.$refs.sushiForm.editSushiItem(this.institution.id, item);
    },
    async refreshSushiItems() {
      if (!this.hasInstitution) { return; }

      this.refreshing = true;

      try {
        this.sushiItems = await this.$axios.$get(`/institutions/${this.institution.id}/sushi`);
      } catch (e) {
        this.$store.dispatch('snacks/error', 'Impossible de récupérer les informations sushi');
      }

      this.refreshing = false;
    },
    async deleteData() {
      if (this.selected.length === 0) {
        return;
      }

      const ids = this.selected.map(select => select.id);
      let response;

      try {
        response = await this.$axios.$post(`/institutions/${this.institution.id}/sushi/delete`, { ids });
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
        this.$store.dispatch('snacks/error', `Impossible de supprimer l'élment ${id}`);
      });


      if (deleted.length > 0) {
        this.$store.dispatch('snacks/success', `${deleted.length} élement(s) supprimé(s)`);

        const removeDeleted = ({ id }) => !deleted.some(item => item.id === id);
        this.sushiItems = this.sushiItems.filter(removeDeleted);
        this.selected = this.selected.filter(removeDeleted);
      }
    },
  },
};
</script>
