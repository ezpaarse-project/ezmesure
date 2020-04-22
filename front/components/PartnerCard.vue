<template>
  <v-card width="350" height="100%" class="flexCard">
    <v-card-text class="text-center grow">
      <v-img
        v-if="logoUrl"
        :src="`/api/correspondents/pictures/${logoUrl}`"
        contain
        height="100"
        class="mb-3"
      />

      <v-img
        v-else
        contain
        height="100"
        class="mb-3"
      />

      <div class="title">
        {{ organisation.name }}
      </div>
      <div class="body-2">
        {{ indexCount }} <abbr title="Événements de consultation">ECs</abbr> chargés
      </div>
    </v-card-text>

    <v-divider />

    <v-card-text class="text-center">
      <div class="subtitle-1">
        Correspondants
      </div>

      <div v-for="(contact, key) in contacts" :ref="key" :key="key">
        <v-tooltip v-if="contact.confirmed" right>
          <template v-slot:activator="{ on }">
            <span v-on="on">{{ contact.fullName }}</span>
          </template>
          <span>
            <span v-for="(type, k) in contact.type" :ref="k" :key="k">
              {{ contactType[type].value }}
              <v-spacer />
            </span>
          </span>
        </v-tooltip>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  props: {
    partner: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    contacts() { console.log(this.partner); return this.partner.contacts || {}; },
    organisation() { return this.partner.organisation || {}; },
    index() { return this.partner.index || {}; },
    logoUrl() { return this.organisation.logoUrl || null; },
    indexCount() {
      const n = parseInt(this.index.count, 10);
      if (Number.isNaN(n)) { return '0'; }
      return n.toLocaleString();
    },
    contactType() {
      return {
        tech: { value: 'Technique' },
        doc: { value: 'Documentaire' },
      };
    },
  },
};
</script>

<style>
.flexCard {
  display: flex;
  flex-direction: column;
}
</style>
