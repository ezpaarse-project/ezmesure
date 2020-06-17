<template>
  <v-dialog v-model="show" width="900">
    <v-card>
      <v-card-title class="headline">
        Établissement : {{ institution.name }}
      </v-card-title>

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
                  hint="Unité Administrative Immatriculée."
                  persistent-hint
                />
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

              <v-col cols="12">
                <v-hover v-model="hoverLogo" class="mx-auto">
                  <template v-slot:default="{ hover }">
                    <v-card
                      width="320"
                      @dragover.prevent="onDragOver"
                      @dragleave.prevent="onDragLeave"
                      @drop.prevent="onFileDrop"
                    >
                      <v-img
                        contain
                        :src="logoSrc"
                        width="320"
                        height="100"
                      />

                      <v-card-text class="text-center">
                        Logo (ratio 3:1)
                      </v-card-text>

                      <input
                        ref="logo"
                        type="file"
                        accept="image/*"
                        class="d-none"
                        @change="onLogoChange"
                      >

                      <v-fade-transition>
                        <v-overlay v-if="hover" absolute>
                          <div v-if="draggingFile">
                            Déposez votre image ici
                          </div>

                          <div v-else>
                            <v-btn v-if="logoPreview || institution.logoId" @click="removeLogo">
                              Supprimer
                            </v-btn>
                            <v-btn @click="$refs.logo.click()">
                              Modifier
                            </v-btn>
                          </div>
                        </v-overlay>
                      </v-fade-transition>
                    </v-card>
                  </template>
                </v-hover>
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
                  :hint="suggestedPrefix && `Suggestion : ${suggestedPrefix}`"
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
          v-text="editMode ? 'Mettre à jour' : 'Créer'"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
const defaultLogo = require('@/static/images/logo-etab.png');

const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsBinaryString(file);
  reader.onload = () => resolve(btoa(reader.result));
  reader.onerror = error => reject(error);
});

export default {
  data() {
    return {
      show: false,
      saving: false,
      valid: false,

      hoverLogo: false,
      draggingFile: false,
      defaultLogo,
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
    members() {
      const members = this.institution?.contacts;
      return Array.isArray(members) ? members : [];
    },
    logoSrc() {
      if (this.logoPreview) { return this.logoPreview; }
      if (this.institution?.logoId) { return `/api/assets/logos/${this.institution.logoId}`; }
      return defaultLogo;
    },
    suggestedPrefix() {
      const email = this.members[0]?.email;
      const match = /@(\w+)/i.exec(email);
      return match && match[1];
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

    async onLogoChange() {
      this.updateLogo(this.$refs.logo.files[0]);
      this.$refs.logo.value = '';
    },
    onDragOver() {
      this.draggingFile = true;
      this.hoverLogo = true;
    },
    onDragLeave() {
      this.draggingFile = false;
      this.hoverLogo = false;
    },
    onFileDrop(evt) {
      const files = evt?.dataTransfer?.files;
      if (files && files[0]) {
        this.updateLogo(files[0]);
      }
      this.draggingFile = false;
    },
    async updateLogo(file) {
      if (file.type.startsWith('image/')) {
        const base64logo = await toBase64(file);
        this.institution.logo = base64logo;
        this.logoPreview = URL.createObjectURL(file);
      }
    },
    removeLogo() {
      this.logoPreview = null;
      this.institution.logo = null;
      this.institution.logoId = null;
    },

    async save() {
      this.saving = true;

      delete this.institution.sushi;


      try {
        if (this.institution.id) {
          await this.$axios.$patch(`/institutions/${this.institution.id}`, this.institution);
        } else {
          await this.$axios.$post('/institutions', this.institution);
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
