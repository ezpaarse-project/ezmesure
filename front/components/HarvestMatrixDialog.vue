<template>
  <v-dialog
    v-model="show"
    scrollable
    width="1400"
  >
    <HarvestMatrix :sushi-item="sushi" />
  </v-dialog>
</template>

<script>
import HarvestMatrix from '~/components/HarvestMatrix.vue';

export default {
  components: {
    HarvestMatrix,
  },
  data() {
    return {
      show: false,
      sushi: null,
    };
  },
  methods: {
    display(sushi) {
      this.sushi = sushi;
      this.show = true;
    },
  },
};
</script>
