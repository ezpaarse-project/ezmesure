<template>
  <v-container>
    <v-card class="mb-4">
      <v-toolbar card>
        <v-toolbar-title>Conditions d'utilisation</v-toolbar-title>
      </v-toolbar>

      <v-card-text>
        <v-alert v-model="error" dismissible color="error">
          Une erreur est survenue, veuillez réessayer.
        </v-alert>
        <v-alert v-model="pleaseAccept" dismissible color="error">
          Veuillez accepter les conditions d'utilisation.
        </v-alert>

        <p>Afin d'utiliser ce service, vous vous engagez à respecter le <a href="https://www.cnil.fr/fr/reglement-europeen-protection-donnees" target="_blank">règlement général sur la protection des données</a>.</p>

        <p class="text-xs-center">
          <v-checkbox
            v-model="accepted"
            label="J'ai lu et j'accepte les conditions d'utilisation"
            primary
          />
          <v-btn @click="acceptedTerms">
            Activer mon compte
          </v-btn>
        </p>
      </v-card-text>
    </v-card>
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
      success: false,
      error: false,
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

      try {
        await this.$store.dispatch('auth/acceptTerms');
        this.$router.replace({ path: '/myspace' });
      } catch (e) {
        this.error = true;
      }
    },
  },
};
</script>
