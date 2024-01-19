<template>
  <v-container fluid grid-list-lg>
    <v-layout column>
      <v-icon size="100" color="pink">
        mdi-charity
      </v-icon>

      <h1 class="display-1 text-center mb-2">
        <span v-if="filteredPartners.length === partners.length">
          {{ $t('partners.count', { count: partners.length }) }}
        </span>
        <span v-else>
          {{
            $t('partners.filteredCount', {
              count: filteredPartners.length,
              total: partners.length
            })
          }}
        </span>
      </h1>
    </v-layout>

    <v-row align="center" justify="center">
      <v-col cols="12" sm="6" md="5" lg="4">
        <v-text-field
          v-model="search"
          :label="$t('partners.search')"
          solo
          max-width="200"
          append-icon="mdi-magnify"
          hide-details
        />
      </v-col>
    </v-row>

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
      const search = this.search.toLowerCase();

      if (!search) {
        return this.partners.slice().sort(this.sortByName);
      }

      const partners = this.partners.filter((partner) => {
        const {
          name: orgName,
          acronym,
          techContactName,
          docContactName,
        } = partner;

        if (orgName?.toLowerCase?.()?.includes(search)) { return true; }
        if (acronym?.toLowerCase?.()?.includes(search)) { return true; }
        if (typeof techContactName === 'string' && techContactName.toLowerCase().includes(search)) { return true; }
        if (typeof docContactName === 'string' && docContactName.toLowerCase().includes(search)) { return true; }
        return false;
      });

      return partners.sort(this.sortByName);
    },
  },

  methods: {
    sortByName(a, b) {
      return (a?.name?.toLowerCase?.() < b?.name?.toLowerCase?.() ? -1 : 1);
    },
  },
};
</script>
