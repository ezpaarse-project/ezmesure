<template>
  <v-container
    fluid
    fill-height
  >
    <v-layout
      align-center
      justify-center
    >
      <v-flex
        xs12
        sm8
        md4
      >
        <v-card class="elevation-12">
          <v-toolbar
            color="primary"
            dark
            flat
            dense
          >
            <v-toolbar-title>Informations établissement - correspondant</v-toolbar-title>
            <v-spacer />
            <v-icon>mdi-pencil</v-icon>
          </v-toolbar>
          <v-card-text class="mx-auto">
            <v-form>
              <v-container>
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      ref="name"
                      v-model="form.name"
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
                      v-model="form.uai"
                      label="UAI"
                      placeholder="ex: 1234567A"
                      outlined
                      hide-details
                    />
                    <span class="caption">Unité Administrative Immatriculée.</span>
                  </v-col>

                  <v-col cols="12">
                    <v-text-field
                      v-model="form.url"
                      label="Page d'accueil établissement"
                      placeholder="ex: https://cnrs.fr/"
                      outlined
                      hide-details
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-text-field
                      ref="email"
                      v-model="form.email"
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
                      v-model="form.indexAffected"
                      label="Index affecté"
                      placeholder="ex: univ-blancherive"
                      outlined
                      hide-details
                    />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="form.indexSuggested"
                      label="Index suggéré"
                      placeholder="ex: univ-blancherive"
                      outlined
                      hide-details
                    />
                    <span class="caption">Basé sur le domaine de l'adresse email.</span>
                  </v-col>

                  <v-col cols="12">
                    <p>Je souhaite être désigné(e) correspondant :</p>
                    <v-checkbox
                      v-model="form.correspondent"
                      label="Technique"
                      hide-details
                      value="tech"
                    />
                    <v-checkbox
                      v-model="form.correspondent"
                      label="Documentaire"
                      hide-details
                      value="doc"
                    />
                  </v-col>

                  <v-col cols="12" class="text-center">
                    <v-file-input
                      label="Logo établissement"
                      prepend-icon=""
                      prepend-inner-icon="mdi-paperclip"
                      accept="image/png, image/jpeg"
                      outlined
                      @change="upload"
                    />

                    <center>
                      <v-img
                        :src="logoPreview || defaultLogo"
                        width="318px"
                        height="100px"
                        contain
                      />
                    </center>
                  </v-col>
                </v-row>
              </v-container>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              color="primary"
              @click="send"
            >
              Valider
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      form: {
        logo: null,
        name: null,
        uai: null,
        url: null,
        email: null,
        indexAffected: null,
        indexSuggested: null,
        correspondent: [],
      },
      formData: new FormData(),
      errors: {
        name: null,
        email: null,
      },
      defaultLogo: 'https://via.placeholder.com/318x100?text=Aper%C3%A7u+du+rendu+logo',
      logoPreview: null,
    };
  },
  async fetch({ store, redirect, route }) {
    await store.dispatch('auth/checkAuth');
    const { user } = store.state.auth;

    if (!user) {
      redirect('/authenticate', { origin: route.fullPath });
    } else if (!user.metadata.acceptedTerms) {
      redirect('/terms');
    }
  },
  computed: {
    user() { return this.$store.state.auth.user; },
  },
  mounted() {
    this.form.email = this.user.email;
    this.indexSuggested();
  },
  methods: {
    indexSuggested() {
      const index = this.form.email.match(/@(\w+)/i);
      if (index) {
        // eslint-disable-next-line prefer-destructuring
        this.form.indexSuggested = index[1];
        return;
      }
      this.form.indexSuggested = '';
    },
    upload(event) {
      if (!event) {
        this.logoPreview = this.defaultLogo;
        this.form.logo = null;
        return;
      }
      this.logoPreview = URL.createObjectURL(event);

      this.form.logo = event;
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
      this.indexSuggested();
    },
    send() {
      if (!this.errors.name && !this.errors.email) {
        this.formData.append('logo', this.form.logo);
        this.formData.append('name', this.form.name);
        this.formData.append('uai', this.form.uai);
        this.formData.append('url', this.form.url);
        this.formData.append('email', this.form.email);
        this.formData.append('indexAffected', this.form.indexAffected);
        this.formData.append('indexSuggested', this.form.indexSuggested);
        this.formData.append('correspondent', this.form.correspondent);

        this.$axios.post('/correspondent/', this.formData, {
          headers: {
            // eslint-disable-next-line no-underscore-dangle
            'Content-Type': `multipart/form-data; boundary=${this.formData._boundary}`,
          },
        })
          .then((res) => {
            if (res.status === 200 && res.data === 'OK') {
              this.$store.dispatch('snacks/success', 'Informations transmises');

              this.form = {
                logo: null,
                name: null,
                uai: null,
                url: null,
                email: null,
                indexAffected: null,
                indexSuggested: null,
                correspondent: [],
              };
              this.formData = new FormData();
              this.errors = {
                name: null,
                email: null,
              };
              this.logoPreview = this.defaultLogo;
            }
          })
          .catch(() => this.$store.dispatch('snacks/error', 'L\'envoi du forumlaire a échoué'));

        this.formData = new FormData();
      }
    },
  },
};
</script>
