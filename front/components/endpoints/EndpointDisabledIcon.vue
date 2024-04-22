<template>
  <v-chip v-if="isDisabled" small>
    <LocalDate :date="disabledUntil" format="PPPp" />

    <v-icon right small>
      mdi-download-off
    </v-icon>
  </v-chip>
</template>

<script setup>
import { computed } from 'vue';
import { parseISO, isValid, isFuture } from 'date-fns';

import LocalDate from '../LocalDate.vue';

const props = defineProps({
  endpoint: {
    type: Object,
    required: true,
  },
});

const disabledUntil = computed(() => {
  if (!props.endpoint.disabledUntil) {
    return undefined;
  }
  return parseISO(props.endpoint.disabledUntil);
});

const isDisabled = computed(
  () => disabledUntil.value
    && isValid(disabledUntil.value)
    && !isFuture(disabledUntil.value),
);
</script>
