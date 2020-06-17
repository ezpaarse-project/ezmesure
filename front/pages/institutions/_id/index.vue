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
                v-model="institution.name"
                label="Nom établissement *"
                placeholder="ex: Université de Blancherive"
                :rules="[v => !!v || 'Veuillez saisir un nom d\'établissement.']"
                outlined
                required
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="institution.uai"
                label="UAI"
                placeholder="ex: 1234567A"
                outlined
                hide-details
              />
              <span class="caption">Unité Administrative Immatriculée.</span>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="institution.website"
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
                :hint="suggestedPrefix && `Suggestion : ${suggestedPrefix}`"
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

const defaultLogo = require('@/static/images/logo-etab.png');

const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsBinaryString(file);
  reader.onload = () => resolve(btoa(reader.result));
  reader.onerror = error => reject(error);
});

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
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

    if (institution) {
      institution.index = institution.index || {};
    }

    return {
      valid: false,
      hoverLogo: false,
      draggingFile: false,
      defaultLogo,
      logoPreview: null,
      loading: false,
      institution,
    };
  },
  computed: {
    logoSrc() {
      if (this.logoPreview) { return this.logoPreview; }
      if (this.institution?.logoId) { return `/api/assets/logos/${this.institution.logoId}`; }
      return defaultLogo;
    },
    suggestedPrefix() {
      const match = /@(\w+)/i.exec(this.$auth.$state?.user?.email);
      return match && match[1];
    },
  },
  methods: {
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
      this.loading = true;

      if (this.institution.id) {
        try {
          await this.$axios.$patch(`/institutions/${this.institution.id}`, this.institution);
        } catch (e) {
          this.$store.dispatch('snacks/error', 'L\'envoi du formulaire a échoué');
          this.loading = false;
          return;
        }
        this.$store.dispatch('snacks/success', 'Établissement mis à jour');
      }

      if (!this.institution.id) {
        try {
          await this.$axios.$post('/institutions', this.institution);
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
