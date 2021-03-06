<template>
  <v-container fluid grid-list-lg>
    <v-layout column>
      <v-icon size="100" color="pink">
        mdi-charity
      </v-icon>

      <h1
        class="display-1 text-center mb-2"
        v-text="$t('partners.count', { count: partners.length })"
      />
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
      <v-col cols="12" sm="6" md="5" lg="4">
        <v-select
          v-model="selectedAutomations"
          :items="automations"
          :item-text="item => $t(`partners.auto.${item.label}`)"
          item-value="label"
          :label="$t('partners.automated')"
          solo
          multiple
          hide-details
          max-width="200"
        >
          <template v-slot:selection="{ item }">
            <v-chip
              :color="item.color"
              label
              dark
              close
              @click:close="deselectAutomation(item.label)"
            >
              {{ $t(`partners.auto.${item.label}`) }}
            </v-chip>
          </template>
        </v-select>
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
      selectedAutomations: [],
      automations: [
        { label: 'ezpaarse', color: 'teal' },
        { label: 'ezmesure', color: 'purple' },
        { label: 'report', color: 'blue' },
      ],
    };
  },

  computed: {
    filteredPartners() {
      const search = this.search.toLowerCase();
      const automations = this.selectedAutomations;

      if (!search && automations.length === 0) { return this.partners; }

      return this.partners.filter((partner) => {
        const {
          name: orgName,
          techContactName,
          docContactName,
          auto = {},
        } = partner;

        if (search) {
          if (orgName && orgName.toLowerCase().includes(search)) { return true; }
          if (typeof techContactName === 'string' && techContactName.toLowerCase().includes(search)) { return true; }
          if (typeof docContactName === 'string' && docContactName.toLowerCase().includes(search)) { return true; }
          return false;
        }

        if (automations.length > 0) {
          return automations.some(label => auto?.[label]);
        }

        return false;
      });
    },
  },

  methods: {
    deselectAutomation(label) {
      this.selectedAutomations = this.selectedAutomations.filter(l => l !== label);
    },
  },
};
</script>
