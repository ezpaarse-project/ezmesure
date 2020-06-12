<template>
  <section>
    <ToolBar title="Correspondant" />
    <v-card-text v-if="hasInstitution">
      <v-form v-model="valid">
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-text-field
                ref="email"
                v-model="contact.email"
                label="Adresse email *"
                type="email"
                :rules="[
                  v => !!v || '',
                  v => /.+@.+\..+/.test(v) || 'Veuillez saisir un email valide.',
                ]"
                placeholder="ex: john@doe.fr"
                outlined
                required
                :disabled="contact.email.length > 0"
              />
            </v-col>

            <v-col cols="12">
              <p>Je souhaite être désigné(e) correspondant :</p>
              <v-checkbox
                v-model="contact.type"
                label="Technique"
                hide-details
                value="tech"
              />
              <v-checkbox
                v-model="contact.type"
                label="Documentaire"
                hide-details
                value="doc"
              />
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </v-card-text>
    <v-card-actions v-if="hasInstitution">
      <span class="caption">* champs obligatoires</span>
      <v-spacer />
      <v-btn
        color="primary"
        :disabled="loading"
        :loading="loading"
        @click="save"
      >
        Sauvegarder
      </v-btn>
    </v-card-actions>

    <v-card-text v-else>
      <div class="mb-2">
        Vous n'êtes rattachés à aucun établissement,
        où vous n'avez déclaré aucunes informations sur votre établissement.
      </div>
      <a :href="'/info/institution'">
        Déclarer des informations d'établissement.
      </a>
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
  async asyncData({ $axios, store }) {
    let institution = null;
    let contact = {};
    try {
      institution = await $axios.$get('/institutions/members/self');
    } catch (e) {
      store.dispatch('snacks/error', 'Impossible de récupérer les informations correspondant');
    }

    if (institution) {
      // eslint-disable-next-line prefer-destructuring
      contact = institution.contact;
    }

    return {
      valid: false,
      lazy: false,
      loading: false,
      institution,
      contact,
    };
  },
  computed: {
    hasInstitution() {
      return !!this.institution?.id;
    },
  },
  methods: {
    async save() {
      this.loading = true;

      try {
        await this.$axios.$patch(`/institutions/${this.institution.id}/members/self`, this.contact);
      } catch (e) {
        this.$store.dispatch('snacks/error', 'L\'envoi du formulaire a échoué');
        this.loading = false;
        return;
      }

      this.$store.dispatch('snacks/success', 'Informations transmises');
      this.loading = false;
    },
  },
};
</script>
