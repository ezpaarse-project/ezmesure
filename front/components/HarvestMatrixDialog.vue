<template>
  <v-dialog
    v-model="show"
    scrollable
    width="1400"
  >
    <HarvestMatrix :sushi-item="sushi">
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
