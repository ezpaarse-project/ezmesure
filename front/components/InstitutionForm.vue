<template>
  <v-dialog v-model="show" width="900">
    <v-card>
      <v-card-title class="headline" v-text="institution.vendor" />

      <v-card-text>
        <v-form id="institutionForm" ref="form" v-model="valid" @submit.prevent="save">
          <v-container>
            <v-row>
              <v-col cols="12">
                <span class="subtitle-1">Établissement :</span>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="institution.name"
                  label="Nom établissement"
                  hide-details
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="institution.shortName"
                  label="Sigle"
                  hide-details
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="institution.website"
                  label="Page d'accueil établissement"
                  hide-details
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="institution.city"
                  label="Ville"
                  hide-details
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="institution.type"
                  label="Type d'établissement"
                  hide-details
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="institution.uai"
                  label="UAI"
                  hide-details
                />
                <span class="caption">Unité Administrative Immatriculée.</span>
              </v-col>

              <v-col cols="12" sm="12">
                <v-combobox
                  v-model="institution.domains"
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
                      'background-color': logoPreview ? 'transparent' : '#ccc',
                      'background-image': `url(${logoPreview || defaultLogo})`
                    }"
                    @dragover="dragAndDrop('over')"
                    @dragleave="dragAndDrop('leave')"
                  >
                    <v-tooltip v-if="logoPreview" right>
                      <template v-slot:activator="{ on }" class="removeLogoTooltip">
                        <v-btn
                          icon
                          small
                          color="error"
                          class="removeLogo"
                          v-on="on"
                          @click="removeLogo()"
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
                      @change="upload()"
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
                  v-model="institution.location.lon"
                  label="Longitude"
                  hide-details
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="institution.location.lat"
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
                  v-model="institution.index.prefix"
                  label="Index"
                  hide-details
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="institution.index.suggested"
                  label="Index suggéré"
                  hide-details
                  disabled
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="institution.index.count"
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
                <v-checkbox v-model="institution.auto.ezpaarse" label="ezPAARSE" />
              </v-col>
              <v-col cols="4">
                <v-checkbox v-model="institution.auto.ezmesure" label="ezMESURE" />
              </v-col>
              <v-col cols="4">
                <v-checkbox v-model="institution.auto.report" label="Reporting" />
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn text @click="show = false">
          Fermer
        </v-btn>

        <v-btn
          type="submit"
          form="institutionForm"
          color="primary"
          text
          :disabled="!valid"
          :loading="saving"
          v-text="editMode ? 'Mettre à jour' : 'Ajouter'"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      show: false,
      saving: false,
      institutionId: null,
      valid: false,

      // eslint-disable-next-line global-require
      defaultLogo: require('@/static/images/logo-etab.png'),
      logo: null,
      logoPreview: null,

      institution: {
        location: {},
        auto: {},
        index: {},
      },
    };
  },
  computed: {
    editMode() {
      return !!this.institution.id;
    },
    vendors() {
      return this.platforms.map(p => p.vendor);
    },
  },
  methods: {
    editInstitution(institution) {
      if (this.$refs.form) {
        this.$refs.form.resetValidation();
      }

      this.institution = JSON.parse(JSON.stringify(institution));
      this.institution.location = this.institution.location || {};
      this.institution.auto = this.institution.auto || {};
      this.institution.index = this.institution.index || {};

      this.show = true;
    },

    createInstitution() {
      this.editInstitution({});
    },

    dragAndDrop(event) {
      if (event === 'over') {
        this.$refs.dropZone.classList.add('overlay');
      }
      if (event === 'leave') {
        this.$refs.dropZone.classList.remove('overlay');
      }
    },
    upload() {
      if (!this.institution) {
        return;
      }
      // eslint-disable-next-line prefer-destructuring
      this.logo = this.$refs.logo.files[0];
      this.logoPreview = URL.createObjectURL(this.logo);
    },
    removeLogo() {
      this.$refs.logo.files.value = '';
      this.logoPreview = null;
      this.logo = null;
    },

    async save() {
      this.saving = true;
      const formData = new FormData();

      delete this.institution.sushi;

      formData.append('logo', this.logo);
      formData.append('form', JSON.stringify(this.institution));

      try {
        if (this.institution.id) {
          await this.$axios.$patch(`/institutions/${this.institution.id}`, formData);
        } else {
          await this.$axios.$post('/institutions', formData);
        }
        this.$emit('update');
      } catch (e) {
        this.$store.dispatch('snacks/error', 'Impossible de mettre à jour l\'établissement');
        this.saving = false;
        return;
      }

      this.$store.dispatch('snacks/success', 'Établissement mis à jour');
      this.saving = false;
      this.show = false;
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
