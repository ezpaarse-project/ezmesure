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
                v-model="email"
                :rules="emailRules"
                label="Email"
                name="email"
                outlined
                clearable
                required
              />
              <v-select
                v-model="object"
                :items="objects"
                :rules="objectRules"
                label="Objet"
                name="object"
                outlined
                required
              />
              <v-textarea
                v-model="message"
                :rules="messageRules"
                label="Message"
                name="message"
                outlined
                required
              />
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn color="error" @click="$router.go(-1)">
              Annuler
            </v-btn>
            <v-btn :disabled="!valid" color="primary" @click="validate">
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
    object: '',
    objectRules: [v => !!v || 'L\'objet est requis'],
    objects: ['Demande de renseignements', 'Rapport de bugs'],
    valid: true,
  }),
  methods: {
    async validate() {
      this.$refs.form.validate();

      if (this.valid) {
        try {
          await this.$axios.post('/contact', {
            email: this.email,
            object: this.object,
            message: this.message,
          });
          this.$store.dispatch('snacks/success', 'Votre demande de contact vient d\'être envoyé à l\'équipe.');

          this.email = '';
          this.object = '';
          this.message = '';
          this.$refs.form.reset();
        } catch (e) {
          this.$store.dispatch('snacks/error', 'L\'envoi du formulaire de contact à échoué.');
        }
      }
    },
  },
};
</script>
