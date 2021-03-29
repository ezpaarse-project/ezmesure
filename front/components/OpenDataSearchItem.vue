<template>
  <v-list-item-content>
    <v-list-item-title v-text="title" />
    <v-list-item-subtitle v-text="subtitle" />
  </v-list-item-content>
</template>

<script>
export default {
  props: {
    item: {
      type: Object,
      default: () => ({}),
    },
    highlight: {
      type: Function,
      default: x => x,
    },
  },
  computed: {
    title() {
      return this.item?.sigle ? `${this.item?.nom} (${this.item?.sigle})` : `${this.item?.nom}`;
    },
    subtitle() {
      const {
        commune,
        departement,
        region,
        code_uai: uai,
        n_siret: siret,
      } = (this.item || {});

      let str = `${commune || departement || region}`;
      if (uai) { str += ` - UAI ${uai}`; }
      if (siret) { str += ` - Siret ${siret}`; }
      return str;
    },
  },
};
</script>
