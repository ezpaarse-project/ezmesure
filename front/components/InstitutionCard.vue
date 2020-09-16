<template>
  <v-card class="w-600 mx-auto">
    <v-img
      v-if="institution.logoId"
      :src="`/api/assets/logos/${institution.logoId}`"
      contain
      height="100"
      class="mb-3"
    />

    <v-divider v-if="institution.logoId" />

    <v-card-title>
      {{ $t('institutions.institution.identity') }}
    </v-card-title>

    <v-list two-line>
      <v-list-item v-for="field in fields" :key="field.name">
        <v-list-item-icon>
          <v-icon color="secondary">
            {{ field.icon }}
          </v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title v-text="field.value" />
          <v-list-item-subtitle v-text="$t(`institutions.institution.${field.name}`)" />
        </v-list-item-content>
      </v-list-item>
    </v-list>

    <v-divider />

    <v-card-title>
      {{ $t('institutions.institution.status') }}

      <v-spacer />

      <v-chip
        label
        :color="institution.validated ? 'success' : 'default'"
        outlined
      >
        <span v-if="institution.validated" v-text="$t('institutions.institution.validated')" />
        <span v-else v-text="$t('institutions.institution.notValidated')" />
      </v-chip>
    </v-card-title>

    <v-divider />

    <v-card-title>
      {{ $t('institutions.institution.attachedDomains') }}
    </v-card-title>

    <v-card-text>
      <template v-if="hasDomains">
        <v-list-item v-for="domain in institution.domains" :key="domain">
          <v-list-item-content>
            <v-list-item-title>{{ domain }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>

      <p v-else v-text="$t('institutions.institution.noAttachedDomains')" />
    </v-card-text>
  </v-card>
</template>

<script>
const defaultLogo = require('@/static/images/logo-etab.png');

export default {
  props: {
    institution: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      defaultLogo,
    };
  },
  computed: {
    fields() {
      let { name } = this.institution;

      if (name && this.institution.acronym) {
        name = `${name} (${this.institution.acronym})`;
      }

      const fields = [
        { name: 'name', value: name, icon: 'mdi-card-account-details' },
        { name: 'homepage', value: this.institution.homepage, icon: 'mdi-web' },
        { name: 'city', value: this.institution.city, icon: 'mdi-map-marker' },
        { name: 'type', value: this.institution.type, icon: 'mdi-tag' },
        { name: 'uai', value: this.institution.uai, icon: 'mdi-identifier' },
        { name: 'indexPrefix', icon: '' },
        { name: 'indexCount', icon: '' },
      ];

      return fields.filter(f => f.value);
    },
    logoSrc() {
      if (this.institution?.logoId) { return `/api/assets/logos/${this.institution.logoId}`; }
      return defaultLogo;
    },
    hasDomains() {
      return Array.isArray(this.institution?.domains) && this.institution.domains.length > 0;
    },
  },
};
</script>
