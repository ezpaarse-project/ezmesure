<template>
  <v-chip
    v-if="lastHarvest"
    :color="chipColor"
    small
    outlined
    class="white--text"
    @click="$emit('click', lastHarvest)"
  >
    <v-icon left small>
      {{ chipIcon }}
    </v-icon>

    <LocalDate :date="lastHarvest.harvestDate" />
  </v-chip>
</template>

<script setup>
import { computed } from 'vue';
import { parseISO } from 'date-fns';
import { colors, icons } from '../harvest/state';
import LocalDate from '../LocalDate.vue';

const props = defineProps({
  harvests: {
    type: Array,
    required: true,
  },
});

defineEmits(['click']);

const lastHarvest = computed(
  () => props.harvests
    .map((harvest) => ({ ...harvest, harvestDate: parseISO(harvest.harvestedAt) }))
    .sort((a, b) => b.harvestDate - a.harvestDate)
    .at(0),
);
const chipColor = computed(() => lastHarvest.value && colors.get(lastHarvest.value.status));
const chipIcon = computed(() => lastHarvest.value && icons.get(lastHarvest.value.status));
</script>
