<template>
  <v-card class="d-flex flex-column">
    <v-responsive :aspect-ratio="3" class="shrink">
      <v-sheet
        color="grey lighten-4"
        class="fill-height d-flex align-center justify-center"
      >
        <v-img
          v-if="logoSrc"
          :aspect-ratio="3"
          :src="logoSrc"
          contain
        />
        <span v-else class="font-weight-light text--secondary">
          {{ $t('institutions.noLogo') }}
        </span>
      </v-sheet>
    </v-responsive>

    <v-card-title>
      {{ institutionName }}
    </v-card-title>

    <v-spacer />

    <v-card-text class="d-flex align-center justify-space-between">
      <v-chip
        :color="institution.validated ? 'success' : 'default'"
        label
        outlined
        small
      >
        {{
          institution.validated
            ? $t('institutions.institution.validated')
            : $t('institutions.institution.notValidated')
        }}
      </v-chip>

      <slot name="menu" :permissions="permissions" :validated="validated" />
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
    membership: {
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
    institutionName() {
      let name = this.institution?.name;

      if (name && this.institution?.acronym) {
        name = `${name} (${this.institution.acronym})`;
      }

      return name;
    },
    fields() {
      let { name } = this.institution;

      if (name && this.institution.acronym) {
        name = `${name} (${this.institution.acronym})`;
      }

      const fields = [
        { name: 'homepage', value: this.institution.homepage, icon: 'mdi-web' },
        { name: 'city', value: this.institution.city, icon: 'mdi-map-marker' },
        { name: 'type', value: this.institution.type, icon: 'mdi-tag' },
        { name: 'uai', value: this.institution.uai, icon: 'mdi-identifier' },
        { name: 'role', value: this.institution.role, icon: 'mdi-shield' },
        { name: 'indexPrefix', value: this.institution.indexPrefix, icon: 'mdi-contain-start' },
        { name: 'indexCount', value: this.institution.indexCount, icon: 'mdi-counter' },
      ];

      return fields.filter((f) => f.value);
    },
    logoSrc() {
      return this.institution?.logoId && `/api/assets/logos/${this.institution.logoId}`;
    },
    validated() {
      return !!this.institution?.validated;
    },
    permissions() {
      return new Set(
        Array.isArray(this.membership?.permissions)
          ? this.membership.permissions
          : [],
      );
    },
  },
};
</script>
