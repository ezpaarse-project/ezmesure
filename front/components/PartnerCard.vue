<template>
  <v-card width="350" height="100%" class="flexCard">
    <v-card-text class="text-center grow">
      <v-img
        v-if="partner.logoId"
        :src="`/api/assets/logos/${partner.logoId}`"
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
        {{ partner.name }}
      </div>
      <div class="body-2">
        {{ indexCount }} <abbr :title="$t('partners.ecs')">ECs</abbr> {{ $t('partners.ecsLoaded') }}
      </div>
    </v-card-text>

    <v-divider />

    <v-card-text class="text-center">
      <div class="subtitle-1" v-text="$t('partners.correspondents')" />

      <div v-for="contact in contacts" :key="contact.name">
        <v-tooltip right>
          <template v-slot:activator="{ on }">
            <span v-on="on">{{ contact.name }}</span>
          </template>
          <span v-if="contact.type === 'tech'">
            {{ $t('partners.technical') }}
          </span>
          <span v-else-if="contact.type === 'doc'">
            {{ $t('partners.documentary') }}
          </span>
          <span v-else-if="contact.type === 'doc-tech'">
            {{ $t('partners.technical') }} / {{ $t('partners.documentary') }}
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
    contacts() {
      const doc = this.partner?.docContactName;
      const tech = this.partner?.techContactName;

      if (!doc && !tech) { return []; }
      if (doc === tech) { return [{ name: doc, type: 'doc-tech' }]; }

      const contacts = [];

      if (doc) { contacts.push({ name: doc, type: 'doc' }); }
      if (tech) { contacts.push({ name: tech, type: 'tech' }); }

      return contacts;
    },
    indexCount() {
      const n = parseInt(this.partner?.indexCount, 10);
      if (Number.isNaN(n)) { return '0'; }
      return n.toLocaleString();
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
