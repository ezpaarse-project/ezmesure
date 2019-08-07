<template>
  <v-container fluid grid-list-lg>
    <v-layout column>
      <v-icon size="100" color="pink">
        mdi-charity
      </v-icon>

      <h1 class="display-1 text-center mb-2">
        Nos {{ partners.length }} partenaires
      </h1>
    </v-layout>

    <v-layout row justify-center align-center>
      <v-flex xs12 sm8 md6 lg4>
        <v-text-field
          v-model="search"
          label="Recherche"
          solo
          max-width="200"
          append-icon="mdi-magnify"
        />
      </v-flex>
    </v-layout>

    <v-layout row wrap justify-center>
      <v-flex v-for="(partner, index) in filteredPartners" :key="index" shrink>
        <PartnerCard :partner="partner" />
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import PartnerCard from '~/components/PartnerCard.vue';

export default {
  components: {
    PartnerCard,
  },
  async asyncData({ app }) {
    return {
      partners: await app.$axios.$get('/partners'),
      search: '',
    };
  },

  computed: {
    filteredPartners() {
      if (!this.search) { return this.partners; }

      const lowerSearch = this.search.toLowerCase();

      return this.partners.filter(({ organisation = {}, contact = {} }) => {
        const orgName = organisation.name;

        if (orgName && orgName.toLowerCase().includes(lowerSearch)) { return true; }
        if (!contact.confirmed) { return false; }

        const { doc = {}, tech = {} } = contact;

        if (typeof doc.firstName === 'string' && doc.firstName.toLowerCase().includes(lowerSearch)) { return true; }
        if (typeof doc.lastName === 'string' && doc.lastName.toLowerCase().includes(lowerSearch)) { return true; }
        if (typeof tech.firstName === 'string' && tech.firstName.toLowerCase().includes(lowerSearch)) { return true; }
        if (typeof tech.lastName === 'string' && tech.lastName.toLowerCase().includes(lowerSearch)) { return true; }

        return false;
      });
    },
  },
};
</script>
