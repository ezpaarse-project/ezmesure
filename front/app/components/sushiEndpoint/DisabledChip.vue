<template>
  <v-chip
    v-if="isDisabled"
    v-tooltip="$t('endpoints.disabledUntilDesc')"
    prepend-icon="mdi-download-off"
    size="small"
  >
    {{ disabledUntil }}
  </v-chip>
</template>

<script setup>
import { isValid, isFuture, parseISO } from 'date-fns';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const disabledUntil = useDateFormat(() => props.modelValue.disabledUntil);

const isDisabled = computed(() => {
  const isoDisabledUntil = parseISO(props.modelValue.disabledUntil ?? '');
  return isValid(isoDisabledUntil) && isFuture(isoDisabledUntil);
});
</script>
