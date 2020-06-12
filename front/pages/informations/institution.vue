<template>
  <section>
    <ToolBar title="Mon établissement" />

    <v-card-text v-if="institution">
      <v-form v-model="valid">
        <v-container>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                ref="name"
                v-model="institution.organisation.name"
                label="Nom établissement *"
                placeholder="ex: Université de Blancherive"
                :rules="[v => !!v || 'Veuillez saisir un nom d\'établissement.']"
                outlined
                required
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="institution.organisation.uai"
                label="UAI"
                placeholder="ex: 1234567A"
                outlined
                hide-details
              />
              <span class="caption">Unité Administrative Immatriculée.</span>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="institution.organisation.website"
                label="Page d'accueil établissement"
                placeholder="ex: https://cnrs.fr/"
                outlined
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="institution.index.prefix"
                label="Index affecté"
                placeholder="ex: univ-blancherive"
                outlined
                hide-details
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="institution.index.suggested"
                label="Index suggéré"
                placeholder="ex: univ-blancherive"
                outlined
                readonly
                disabled
                hide-details
              />
              <span class="caption">Basé sur le domaine de l'adresse email.</span>
            </v-col>

            <v-col cols="12" class="text-center">
              <center>
                <section
                  ref="dropzone"
                  cols="12"
                  class="text-center dropZone"
                  :class="{ overlay: hoverDropzone }"
                  :style="{
                    'background-color': logoPreview ? 'transparent' : '#ccc',
                    'background-image': `url(
                      ${logoPreview ? logoPreview : require('@/static/images/logo-etab.png')}
                    )`
                  }"
                  @dragover="hoverDropzone = true"
                  @dragleave="hoverDropzone = false"
                >
                  <v-tooltip v-if="logoPreview" right>
                    <template v-slot:activator="{ on }" class="removeLogoTooltip">
                      <v-btn
                        icon
                        small
                        color="error"
                        class="removeLogo"
                        v-on="on"
                        @click="removeLogo"
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
                    @change="upload"
                  >
                </section>
                <span class="caption">320x100</span>
              </center>
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </v-card-text>

    <v-card-actions v-if="institution">
      <span class="caption">* champs obligatoires</span>
      <v-spacer />
      <v-btn
        color="primary"
        :disabled="!valid"
        :loading="loading"
        @click="save"
      >
        Sauvegarder
      </v-btn>
    </v-card-actions>

    <v-card-text v-else>
      <v-alert type="error" :value="true">
        Les informations de votre établissement n'ont pas pu être récupérées.
      </v-alert>
    </v-card-text>
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar';

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
  },
  async asyncData({ $axios, store }) {
    let institution = null;

    try {
      institution = await $axios.$get('/institutions/self');
    } catch (e) {
      if (e.response?.status === 404) {
        institution = {};
      } else {
        store.dispatch('snacks/error', 'Impossible de récupérer les informations d\'établissement');
      }
    }

    if (institution) {
      institution.organisation = institution.organisation || {};
      institution.index = institution.index || {};
    }

    return {
      valid: false,
      logo: null,
      logoPreview: null,
      loading: false,
      hoverDropzone: false,
      institution,
    };
  },
  methods: {
    upload() {
      if (!this.$refs.logo.files) {
        this.logoPreview = null;
        this.logo = null;
        return true;
      }

      const logo = this.$refs.logo.files[0];
      const logoPreview = URL.createObjectURL(logo);

      this.logo = logo;
      this.logoPreview = logoPreview;
      return true;
    },
    removeLogo() {
      this.logoPreview = null;
      this.logo = null;
    },
    async save() {
      this.loading = true;
      const formData = new FormData();

      formData.append('logo', this.logo);
      formData.append('form', JSON.stringify(this.institution));

      if (this.institution.id) {
        try {
          await this.$axios.$patch(`/institutions/${this.institution.id}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (e) {
          this.$store.dispatch('snacks/error', 'L\'envoi du formulaire a échoué');
          this.loading = false;
          return;
        }
        this.$store.dispatch('snacks/success', 'Établissement mis à jour');
      }

      if (!this.institution.id) {
        try {
          await this.$axios.$post('/institutions', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (e) {
          this.$store.dispatch('snacks/error', 'L\'envoi du formulaire a échoué');
          this.loading = false;
          return;
        }
        this.$store.dispatch('snacks/success', 'Informations d\'établissement transmises');
      }

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
