<template>
  <section>
    <v-toolbar dense flat>
      <v-toolbar-title>
        Informations établissement - correspondant
      </v-toolbar-title>
    </v-toolbar>

    <v-card flat class="mx-auto mb-5" max-width="800px">
      <v-card-text>
        {{ establishment }}
        <v-form>
          <v-container>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  ref="name"
                  v-model="establishment.organisation.name"
                  label="Nom établissement *"
                  placeholder="ex: Université de Blancherive"
                  :rules="[v => !!v || '']"
                  outlined
                  required
                  hide-details
                  @change="valideName"
                  @blur="valideName"
                />
                <span v-if="errors.name" class="red--text" v-text="errors.name" />
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
                  hide-details
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  ref="email"
                  v-model="establishment.contacts[0].email"
                  label="Adresse email *"
                  type="email"
                  :rules="[
                    v => !!v || '',
                    v => /.+@.+\..+/.test(v) || '',
                  ]"
                  placeholder="ex: john@doe.fr"
                  outlined
                  required
                  hide-details
                  @change="valideMail"
                  @blur="valideMail"
                />
                <span v-if="errors.email" class="red--text" v-text="errors.email" />
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

              <v-col cols="12">
                <p>Je souhaite être désigné(e) correspondant :</p>
                <v-checkbox
                  v-model="establishment.contacts[0].type"
                  label="Technique"
                  hide-details
                  value="tech"
                />
                <v-checkbox
                  v-model="establishment.contacts[0].type"
                  label="Documentaire"
                  hide-details
                  value="doc"
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
          @click="send"
        >
          Valider
        </v-btn>
      </v-card-actions>
    </v-card>
  </section>
</template>

<script>
export default {
  data() {
    return {
      logo: null,
      formData: new FormData(),
      errors: {
        name: null,
        email: null,
      },
      logoPreview: null,
    };
  },
  async fetch({ store, redirect, route }) {
    await store.dispatch('auth/checkAuth');
    const { user } = store.state.auth;

    const isAdmin = user.roles.find(role => role === 'admin');
    const isTester = user.roles.find(role => role === 'tester');

    if (!user) {
      redirect('/authenticate', { origin: route.fullPath });
    } else if (!user.metadata.acceptedTerms) {
      redirect('/terms');
    } else if (!isAdmin || !isTester) {
      redirect('/myspace');
    }
  },
  computed: {
    user() { return this.$store.state.auth.user; },
    establishment() {
      const establishment = JSON.parse(JSON.stringify(this.$store.state.establishment));

      establishment.contacts[0].fullName = this.user.full_name;
      establishment.contacts[0].email = this.user.email;
      const index = this.user.email.match(/@(\w+)/i);
      if (index) {
        // eslint-disable-next-line prefer-destructuring
        establishment.index.suggested = index[1];
        // eslint-disable-next-line prefer-destructuring
        establishment.index.prefix = index[1];
      }

      return establishment;
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
        this.logo = null;
        this.logoPreview = null;
        return;
      }
      const logo = this.$refs.logo.files[0];
      this.logoPreview = URL.createObjectURL(logo);

      this.establishment.logo = logo;
    },
    removeLogo() {
      this.$refs.logo.files.value = '';
      this.logoPreview = null;
      this.logo = null;
    },
    valideName() {
      if (!this.$refs.name.validate()) {
        this.errors.name = 'Veuillez saisir un nom d\'établissement.';
      } else {
        this.errors.name = '';
      }
    },
    valideMail() {
      if (!this.$refs.email.validate()) {
        this.errors.email = 'Veuillez saisir un email valide.';
      } else {
        this.errors.email = '';
      }
    },
    send() {
      this.valideName();
      this.valideMail();

      if (!this.errors.name && !this.errors.email) {
        this.formData.append('logo', this.logo);
        this.formData.append('form', JSON.stringify(this.establishment));

        this.$axios.post('/correspondents/store', this.formData, {
          headers: {
            // eslint-disable-next-line no-underscore-dangle
            'Content-Type': `multipart/form-data; boundary=${this.formData._boundary}`,
          },
        })
          .then((res) => {
            if (res.status === 200 && res.data === 'OK') {
              this.$store.dispatch('snacks/success', 'Informations transmises');

              this.logo = null;
              this.formData = new FormData();
              this.errors = {
                name: null,
                email: null,
              };
              this.logoPreview = null;
              this.$refs.name.resetValidation();
              this.$refs.email.resetValidation();
            }
          })
          .catch(() => this.$store.dispatch('snacks/error', 'L\'envoi du forumlaire a échoué'));

        this.formData = new FormData();
      }
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
