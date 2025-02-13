<template>
  <v-chip
    v-if="lastHarvest"
    :prepend-icon="chip?.icon"
    :text="lastHarvestDate"
    :color="chip?.color"
    size="small"
    variant="outlined"
    @click="$emit('click:harvest', lastHarvest)"
  />
</template>

<script setup>
import { parseISO } from 'date-fns';

const activeState = new Set(['waiting', 'running', 'delayed']);

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
});

defineEmits({
  'click:harvest': (harvest) => !!harvest,
});

const lastHarvest = computed(
  () => props.modelValue
    .map((harvest) => ({ ...harvest, harvestDate: parseISO(harvest.harvestedAt) }))
    .sort((a, b) => b.harvestDate - a.harvestDate)
    .at(0),
);
const lastHarvestDate = useDateFormat(() => lastHarvest.value?.harvestDate);

const chip = computed(() => {
  const activeHarvest = props.modelValue.find((h) => activeState.has(h.status));
  if (!activeHarvest) {
    return undefined;
  }
  return {
    color: 'blue',
    icon: 'mdi-play',
  };
});
</script>
