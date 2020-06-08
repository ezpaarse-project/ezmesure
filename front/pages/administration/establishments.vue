<template>
  <section>
    <ToolBar title="Établissements">
      <slot>
        <v-spacer />

        <v-btn text @click="refreshEstablishments">
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
      :items="establishments"
      :expanded.sync="expanded"
      item-key="id"
      show-select
      show-expand
    >
      <template v-slot:item.organisation.website="{ item }">
        <a :href="item.organisation.website" target="_blank" v-text="item.organisation.website" />
      </template>

      <template v-slot:item.automatisations="{ item }">
        <v-chip
          label
          small
          :outlined="!item.auto.ezpaarse"
          :text-color="item.auto.ezpaarse ? 'white' : 'grey'"
          :color="item.auto.ezpaarse ? 'green' : 'grey'"
        >
          <v-avatar v-if="item.auto.ezpaarse" left small>
            <v-icon>mdi-check</v-icon>
          </v-avatar>
          ezPAARSE
        </v-chip>
        <v-chip
          label
          small
          :outlined="!item.auto.ezmesure"
          :text-color="item.auto.ezmesure ? 'white' : 'grey'"
          :color="item.auto.ezmesure ? 'green' : 'grey'"
        >
          <v-avatar v-if="item.auto.ezmesure" left small>
            <v-icon>mdi-check</v-icon>
          </v-avatar>
          ezMESURE
        </v-chip>
        <v-chip
          label
          small
          :outlined="!item.auto.report"
          :text-color="item.auto.report ? 'white' : 'grey'"
          :color="item.auto.report ? 'green' : 'grey'"
        >
          <v-avatar v-if="item.auto.report" left small>
            <v-icon>mdi-check</v-icon>
          </v-avatar>
          Reporting
        </v-chip>
      </template>

      <template v-slot:expanded-item="{ headers, item }">
        <td :colspan="headers.length" class="px-5 py-5">
          <v-row>
            <v-col cols="12">
              <span class="subtitle-1">Établissement :</span>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="item.organisation.name"
                label="Nom établissement"
                hide-details
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="item.organisation.shortName"
                label="Sigle"
                hide-details
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="item.organisation.website"
                label="Page d'accueil établissement"
                hide-details
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="item.organisation.city"
                label="Ville"
                hide-details
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="item.organisation.establishmentType"
                label="Type d'établissement"
                hide-details
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="item.organisation.uai"
                label="UAI"
                hide-details
              />
              <span class="caption">Unité Administrative Immatriculée.</span>
            </v-col>

            <v-col cols="12" sm="12">
              <v-combobox
                v-model="item.organisation.domains"
                label="Domains"
                multiple
                small-chips
                hide-details
              />
            </v-col>

            <v-col cols="12" class="text-center">
              <center>
                <section
                  ref="dropzone"
                  cols="12"
                  class="text-center dropZone"
                  :style="{
                    'background-color': item.logoPreview ? 'transparent' : '#ccc',
                    'background-image': `url(
                    ${
                      item.logoPreview ? item.logoPreview : require('@/static/images/logo-etab.png')
                    }
                    )`
                  }"
                  @dragover="dragAndDrop('over')"
                  @dragleave="dragAndDrop('leave')"
                >
                  <v-tooltip v-if="item.logoPreview" right>
                    <template v-slot:activator="{ on }" class="removeLogoTooltip">
                      <v-btn
                        icon
                        small
                        color="error"
                        class="removeLogo"
                        v-on="on"
                        @click="removeLogo(item.id)"
                      >
                        <v-icon>mdi-close-circle</v-icon>
                      </v-btn>
                    </template>
                    <span>Supprimer logo</span>
                  </v-tooltip>
                  <input
                    ref="logo"
                    type="file"
                    accept="image/*"
                    @change="upload(item.id)"
                  >
                </section>
                <span class="caption">320x100</span>
              </center>
            </v-col>
          </v-row>

          <v-divider />

          <v-row>
            <v-col cols="12">
              <span class="subtitle-1">Localisation :</span>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="item.organisation.location.lon"
                label="Longitude"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="item.organisation.location.lat"
                label="Latitude"
                hide-details
              />
            </v-col>
          </v-row>

          <v-divider />

          <v-row>
            <v-col cols="12">
              <span class="subtitle-1">Index :</span>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="item.index.prefix"
                label="Index"
                hide-details
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="item.index.suggested"
                label="Index suggéré"
                hide-details
                disabled
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="item.index.count"
                label="Total ECs"
                hide-details
                disabled
              />
            </v-col>
          </v-row>

          <v-divider />

          <v-row>
            <v-col cols="12">
              <span class="subtitle-1">Automatisations :</span>
            </v-col>
            <v-col cols="4">
              <v-checkbox v-model="item.auto.ezpaarse" label="ezPAARSE" />
            </v-col>
            <v-col cols="4">
              <v-checkbox v-model="item.auto.ezmesure" label="ezMESURE" />
            </v-col>
            <v-col cols="4">
              <v-checkbox v-model="item.auto.report" label="Reporting" />
            </v-col>
          </v-row>

          <v-divider />

          <v-row>
            <v-col cols="12">
              <span class="subtitle-1">Contacts :</span>
            </v-col>
          </v-row>
          <v-row v-for="(contact, key) in item.contacts" :ref="key" :key="key">
            <v-col cols="5">
              <v-text-field
                v-model="contact.fullName"
                label="Contact"
                hide-details
              />
            </v-col>
            <v-col cols="5">
              <v-combobox
                v-model="contact.type"
                :items="types"
                label="Type"
                multiple
                hide-details
              />
            </v-col>
            <v-col cols="2">
              <v-checkbox v-model="contact.confirmed" label="Contact confirmé" />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-btn
                block
                color="primary"
                @click="updateEstablishment(item)"
              >
                Mettre à jour
              </v-btn>
            </v-col>
          </v-row>
        </td>
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
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar';

export default {
  layout: 'space',
  middleware: ['auth', 'terms', 'isAdmin'],
  components: {
    ToolBar,
  },
  data() {
    return {
      selected: [],
      expanded: [],
      // eslint-disable-next-line global-require
      defaultLogo: require('@/static/images/logo-etab.png'),
      headers: [
        { text: 'Etablissement', value: 'organisation.name' },
        { text: 'Site', value: 'organisation.website' },
        { text: 'Index', value: 'index.prefix' },
        { text: 'ECs', value: 'index.count' },
        { text: 'Automatisations', value: 'automatisations' },
        { text: '', value: 'data-table-expand' },
      ],
      types: ['tech', 'doc'],
      logo: null,
      logoPreview: null,
      establishments: [],
    };
  },
  mounted() {
    return this.refreshEstablishments();
  },
  methods: {
    async refreshEstablishments() {
      let establishments;
      try {
        establishments = await this.$axios.$get('/establishments');
      } catch (e) {
        this.$store.dispatch('snacks/error', 'Impossible de récupérer les informations d\'établissement');
      }

      if (!Array.isArray(establishments)) {
        establishments = [];
      }

      establishments.forEach((establishment) => {
        const users = establishment?.contacts?.users;
        const logoUrl = establishment?.organisation?.logoUrl;

        if (Array.isArray(users)) {
          users.filter(u => u.type).forEach((user) => {
            user.type = user.type.split(',');
          });
        }

        establishment.logo = null;
        establishment.logoPreview = null;

        if (logoUrl) {
          establishment.logoPreview = `/api/establishments/pictures/${logoUrl}`;
        }
      });

      this.establishments = establishments;
    },
    dragAndDrop(event) {
      if (this.$refs && this.$refs.dropZone) {
        if (event && event === 'over') {
          this.$refs.dropZone.classList.add('overlay');
        }
        if (event && event === 'leave') {
          this.$refs.dropZone.classList.remove('overlay');
        }
      }
    },
    upload(itemId) {
      const establishment = this.establishments.find(etab => etab.id === itemId);
      if (establishment) {
        if (!this.$refs.logo.files) {
          establishment.logo = null;
          establishment.logoPreview = null;
          return;
        }
        // eslint-disable-next-line prefer-destructuring
        establishment.logo = this.$refs.logo.files[0];
        establishment.logoPreview = URL.createObjectURL(establishment.logo);
      }
    },
    removeLogo() {
      this.$refs.logo.files.value = '';
      this.logoPreview = null;
      this.logo = null;
    },
    async deleteData() {
      if (this.selected.length === 0) {
        return;
      }

      const ids = this.selected.map(select => select.id);
      let response;

      try {
        response = await this.$axios.$post('/correspondents/delete', { ids });
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
        this.establishments = this.establishments.filter(removeDeleted);
        this.selected = this.selected.filter(removeDeleted);
      }
    },
    async updateEstablishment(establishment) {
      const formData = new FormData();

      delete establishment.logo;
      delete establishment.logoPreview;

      formData.append('logo', establishment.logo);
      formData.append('form', JSON.stringify(establishment));

      try {
        await this.$axios.$post('/correspondents/', formData);
      } catch (e) {
        this.$store.dispatch('snacks/error', 'Impossible de mettre à jour l\'établissement');
        this.loading = false;
        return;
      }

      this.$store.dispatch('snacks/success', 'Établissement mis à jour');
      this.loading = false;
    },
  },
};
</script>

<style scoped>
.dropZone {
  cursor: pointer;
  width: 320px;
  height: 100px;
  background-size: 320px 100px;
  border: 1px solid #ccc;
}
.dropZone input[type='file'] {
  cursor: pointer;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
}
.overlay {
  background-color: rgba(62, 62, 62, 0.3);
  border-color: #787878;
}
.removeLogo {
  float: right;
  display: none;
}
.dropZone:hover > .removeLogo {
  display: inline;
}
</style>
