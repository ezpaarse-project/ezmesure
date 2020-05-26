<template>
  <section>
    <ToolBar title="Informations: Établissement" />
    <v-card-text>
      <v-form
        ref="form"
        v-model="valid"
        :lazy-validation="lazy"
      >
        <v-container>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                ref="name"
                v-model="establishment.organisation.name"
                label="Nom établissement *"
                placeholder="ex: Université de Blancherive"
                :rules="[v => !!v || 'Veuillez saisir un nom d\'établissement.']"
                outlined
                required
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="establishment.organisation.uai"
                label="UAI"
                placeholder="ex: 1234567A"
                outlined
                hide-details
              />
              <span class="caption">Unité Administrative Immatriculée.</span>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="establishment.organisation.website"
                label="Page d'accueil établissement"
                placeholder="ex: https://cnrs.fr/"
                outlined
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="establishment.index.prefix"
                label="Index affecté"
                placeholder="ex: univ-blancherive"
                outlined
                hide-details
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="establishment.index.suggested"
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
                  :style="{
                    'background-color': logoPreview ? 'transparent' : '#ccc',
                    'background-image': `url(
                      ${logoPreview ? logoPreview : require('@/static/images/logo-etab.png')}
                    )`
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
    <v-card-actions>
      <span class="caption">* champs obligatoires</span>
      <v-spacer />
      <v-btn
        color="primary"
        :disabled="!valid || loading"
        :loading="loading"
        @click="save"
      >
        Sauvegarder
      </v-btn>
    </v-card-actions>
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar';

export default {
  layout: 'space',
  middleware: ['isLoggin'],
  components: {
    ToolBar,
  },
  data() {
    return {
      valid: true,
      lazy: false,
      logo: null,
      logoPreview: null,
      formData: new FormData(),
      loading: false,
    };
  },
  async fetch({ store }) {
    await store.dispatch('informations/getEstablishment');
  },
  computed: {
    user() { return this.$store.state.auth.user; },
    establishment: {
      get() {
        if (this.$store.state.informations.establishment) {
          // eslint-disable-next-line vue/no-side-effects-in-computed-properties
          this.logoPreview = this.$store.state.informations.establishment.organisation.logoUrl;
        }
        return this.$store.state.informations.establishment;
      },
      set(newVal) { this.$store.dispatch('informations/setEstablishment', newVal); },
    },
  },
  methods: {
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
    save() {
      this.$refs.form.validate();

      this.loading = true;

      this.formData.append('logo', this.logo);
      this.formData.append('form', JSON.stringify(this.establishment));

      this.$store.dispatch('informations/storeOrUpdateEstablishment', this.formData)
        .then(() => {
          this.$store.dispatch('snacks/success', 'Informations transmises');
          this.formData = new FormData();
          this.loading = false;
        })
        .catch(() => {
          this.$store.dispatch('snacks/error', 'L\'envoi du forumlaire a échoué');
          this.loading = false;
        });
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
