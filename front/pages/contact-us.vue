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
            <v-toolbar-title>Nous contacter</v-toolbar-title>
            <v-spacer />
            <v-icon>mdi-email-edit</v-icon>
          </v-toolbar>

          <v-card-text>
            <v-form
              ref="form"
              v-model="valid"
            >
              <v-text-field
                v-if="!user"
                v-model="email"
                :rules="emailRules"
                label="Email"
                name="email"
                outlined
                clearable
                required
              />
              <v-text-field
                v-else
                :value="user.email"
                :rules="emailRules"
                label="Email"
                name="email"
                outlined
                clearable
                required
                disabled
              />
              <v-select
                v-model="object"
                :items="objects"
                :rules="objectRules"
                label="Objet"
                name="object"
                outlined
                required
                return-object
              />
              <v-textarea
                v-model="message"
                :rules="messageRules"
                label="Message"
                name="message"
                outlined
                required
              />
              <v-checkbox
                v-if="object.value === 'bugs'"
                v-model="sendBrowser"
                label="Envoyer la version de mon navigateur"
              />
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn color="error" @click="$router.go(-1)">
              Annuler
            </v-btn>
            <v-btn
              :disabled="!valid"
              :loading="loading"
              color="primary"
              @click="validate"
            >
              Envoyer
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  data: () => ({
    email: '',
    emailRules: [
      v => !!v || 'L\'adresse email est requise',
      v => /.+@.+\..+/.test(v) || 'L\'adresse email doit être valide',
    ],
    message: '',
    messageRules: [v => !!v || 'Un message est requis'],
    object: {},
    objectRules: [v => !!v || 'L\'objet est requis'],
    objects: [
      {
        value: 'informations',
        text: 'Demande de renseignements',
      },
      {
        value: 'bugs',
        text: 'Rapport de bugs',
      },
    ],
    sendBrowser: true,
    valid: true,
    loading: false,
  }),
  computed: {
    user() { return this.$auth.user; },
  },
  methods: {
    async validate() {
      this.$refs.form.validate();

      if (this.valid) {
        this.loading = true;
        try {
          await this.$axios.post('/contact', {
            email: this.user?.email || this.email,
            object: this.object?.text,
            message: this.message,
            browser: this.sendBrowser && this.object.value === 'bugs' ? navigator.userAgent : null,
          });
          this.$store.dispatch('snacks/success', 'Votre demande de contact vient d\'être envoyé à l\'équipe.');

          this.email = '';
          this.object = {};
          this.message = '';
          this.sendBrowser = true;
          this.$refs.form.resetValidation();
          this.loading = false;
        } catch (e) {
          this.$store.dispatch('snacks/error', 'L\'envoi du formulaire de contact à échoué.');
          this.loading = false;
        }
      }
    },
  },
};
</script>
