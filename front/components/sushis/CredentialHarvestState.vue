<template>
  <v-chip
    v-if="lastHarvest"
    :color="chipColor"
    :class="[chipColor && 'white--text']"
    small
    outlined
    @click="$emit('harvest:click', lastHarvest)"
  >
    <v-icon left small>
      {{ chipIcon }}
    </v-icon>

    <LocalDate :date="lastHarvest.harvestDate.getTime()" format="PPPp" />
  </v-chip>
</template>

<script setup>
import { computed } from 'vue';
import { parseISO } from 'date-fns';
import LocalDate from '../LocalDate.vue';

const activeState = new Set(['waiting', 'running', 'delayed']);

const props = defineProps({
  harvests: {
    type: Array,
    required: true,
  },
});

defineEmits(['harvest:click']);

const lastHarvest = computed(
  () => props.harvests
    .map((harvest) => ({ ...harvest, harvestDate: parseISO(harvest.harvestedAt) }))
    .sort((a, b) => b.harvestDate - a.harvestDate)
    .at(0),
);
const chipColor = computed(() => {
  const activeHarvest = props.harvests.find((h) => activeState.has(h.status));
  if (!activeHarvest) {
    return undefined;
  }
  return 'blue';
});
const chipIcon = computed(() => {
  const activeHarvest = props.harvests.find((h) => activeState.has(h.status));
  if (!activeHarvest) {
    return undefined;
  }
  return 'mdi-play';
});
</script>
