<template>
  <section>
    <ToolBar title="Token d'autentification" />
    <v-card-text>
      <p>
        Ce token est nécessaire pour utiliser l'API d'ezMESURE.
        Pour l'utiliser, ajoutez le header suivant à vos requêtes HTTP :
        <code>Authorization: Bearer {insérez le token ici}</code>
      </p>

      <v-container grid-list-md class="px-0">
        <v-layout row align-center>
          <v-flex grow>
            <v-text-field
              ref="token"
              label="Token"
              :value="token"
              hide-details
              readonly
              outlined
              :type="showToken ? 'text' : 'password'"
              :append-icon="showToken ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append="() => (showToken = !showToken)"
            />
          </v-flex>

          <v-flex v-if="clipboardAvailable" shrink>
            <v-btn text @click="copyTokenToClipboard">
              <v-icon left>
                mdi-clipboard-text
              </v-icon>
              Copier
            </v-btn>
          </v-flex>
        </v-layout>
      </v-container>
    </v-card-text>
  </section>
</template>

<script>
import ToolBar from '~/components/space/ToolBar';

export default {
  layout: 'space',
  middleware: ['auth', 'terms'],
  components: {
    ToolBar,
  },
  data() {
    return {
      showToken: false,
      token: '',
    };
  },
  computed: {
    clipboardAvailable() {
      return navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function';
    },
  },
  async mounted() {
    try {
      this.token = await this.$axios.$get('/profile/token');
    } catch (e) {
      this.$store.dispatch('snacks/error', 'Impossible de récupérer le token d\'authentification');
    }
  },
  methods: {
    async copyTokenToClipboard() {
      try {
        await navigator.clipboard.writeText(this.token);
      } catch (e) {
        this.$store.dispatch('snacks/error', 'La copie du token a échoué');
        return;
      }
      this.$store.dispatch('snacks/info', 'Token copié dans le presse papier');
    },
  },
};
</script>
