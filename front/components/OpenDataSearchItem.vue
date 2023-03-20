<template>
  <v-list-item-content>
    <v-list-item-title>{{ title }}</v-list-item-title>
    <v-list-item-subtitle>{{ subtitle }}</v-list-item-subtitle>
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
      default: (x) => x,
    },
  },
  computed: {
    title() {
      const name = this.item.uo_lib_officiel || this.item.uo_lib;
      return this.item?.sigle ? `${name} (${this.item?.sigle})` : `${name}`;
    },
    subtitle() {
      const {
        localisation,
        uai,
      } = (this.item || {});

      const infos = [];
      if (localisation) { infos.push(localisation); }
      if (uai) { infos.push(`UAI ${uai}`); }
      return infos.join(' - ');
    },
  },
};
</script>
