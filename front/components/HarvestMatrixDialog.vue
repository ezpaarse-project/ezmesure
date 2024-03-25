<template>
  <v-dialog
    v-model="show"
    scrollable
    width="1400"
  >
    <HarvestMatrix :sushi-item="sushi" :initial-year="year">
      <template #actions>
        <v-card-actions>
          <v-spacer />

          <v-btn text @click="show = false">
            {{ $t('close') }}
          </v-btn>
        </v-card-actions>
      </template>
    </HarvestMatrix>
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
      year: null,
      sushi: null,
    };
  },
  methods: {
    display(sushi, year) {
      this.sushi = sushi;
      this.year = year;
      this.show = true;
    },
  },
};
</script>
