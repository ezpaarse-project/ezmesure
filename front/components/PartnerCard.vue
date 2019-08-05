<template>
  <v-card width="350" height="100%" class="flexCard">
    <v-card-text class="text-center grow">
      <v-img
        :src="logoUrl"
        contain
        height="100"
        class="mb-3"
      />

      <div class="title">
        {{ organisation.label || organisation.name }}
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

      <div>
        Documentaire :
        <span v-if="docName" class="text--primary">{{ docName }}</span>
        <span v-else>non confirmé</span>
      </div>

      <div>
        Technique :
        <span v-if="techName" class="text--primary">{{ techName }}</span>
        <span v-else>non confirmé</span>
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
    contact() { return this.partner.contact || {}; },
    organisation() { return this.partner.organisation || {}; },
    index() { return this.partner.index || {}; },
    logoUrl() { return this.organisation.logoUrl; },
    docName() {
      if (!this.contact.confirmed) { return null; }
      if (!this.contact.doc) { return null; }
      const { firstName = '', lastName = '' } = this.contact.doc;
      return `${lastName} ${firstName}`;
    },
    techName() {
      if (!this.contact.confirmed) { return null; }
      if (!this.contact.tech) { return null; }
      const { firstName = '', lastName = '' } = this.contact.tech;
      return `${lastName} ${firstName}`;
    },
    indexCount() {
      const n = parseInt(this.index.count, 10);
      if (Number.isNaN(n)) { return '0'; }
      return n.toLocaleString();
    },
  },
};
</script>

<style>
.flexCard {
  display: flex; flex-direction: column;
}
</style>
