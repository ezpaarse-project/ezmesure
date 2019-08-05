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
            <v-toolbar-title>Conditions d'utilisation</v-toolbar-title>
            <v-spacer />
            <v-icon>mdi-text</v-icon>
          </v-toolbar>

          <v-card-text>
            <v-alert
              v-model="error"
              dismissible
              prominent
              dense
              type="error"
            >
              Une erreur est survenue, veuillez réessayer.
            </v-alert>
            <v-alert
              v-model="pleaseAccept"
              dismissible
              prominent
              dense
              type="error"
            >
              Veuillez accepter les conditions d'utilisation.
            </v-alert>

            <p>
              Afin d'utiliser ce service, vous vous engagez à respecter le
              <a href="https://www.cnil.fr/fr/reglement-europeen-protection-donnees" target="_blank">règlement général sur la protection des données</a>.
            </p>

            <v-checkbox
              v-model="accepted"
              label="J'ai lu et j'accepte les conditions d'utilisation"
            />
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn
              color="primary"
              :loading="loading"
              @click="acceptedTerms"
            >
              Activer mon compte
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  async fetch({ store }) {
    await store.dispatch('auth/checkAuth');
  },
  data() {
    return {
      pleaseAccept: false,
      accepted: false,
      error: false,
      loading: false,
    };
  },
  methods: {
    async acceptedTerms() {
      this.error = false;
      this.pleaseAccept = false;

      if (!this.accepted) {
        this.pleaseAccept = true;
        return;
      }

      this.loading = true;

      try {
        await this.$store.dispatch('auth/acceptTerms');
        this.$router.replace({ path: '/myspace' });
      } catch (e) {
        this.error = true;
      }

      this.loading = false;
    },
  },
};
</script>
