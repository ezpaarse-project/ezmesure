<template>
  <v-container fluid>
    <v-layout
      id="partners"
      row
      wrap
      align-center
      align-content-start
      justify-center
      class="text-center"
    >
      <v-flex xs12>
        <v-icon size="100" color="pink">
          mdi-charity
        </v-icon>

        <h1
          class="display-1 mb-2"
          v-text="$t('partners.count', { count: partners.length })"
        />
      </v-flex>

      <v-flex xs12 sm6 md5 lg4 class="ma-2">
        <v-text-field
          v-model="search"
          :label="$t('partners.search')"
          solo
          max-width="200"
          append-icon="mdi-magnify"
          hide-details
        />
      </v-flex>

      <v-flex xs12 sm6 md5 lg4 class="ma-2">
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
      </v-flex>
    </v-layout>

    <v-layout
      row
      wrap
      justify-center
      class="mb-5"
    >
      <v-flex
        v-for="(partner, index) in filteredPartners"
        :key="index"
        d-flex
        shrink
        class="ma-2"
      >
        <PartnerCard :partner="partner" />
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import PartnerCard from '~/components/PartnerCard.vue';

export default {
  layout: 'home',
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
