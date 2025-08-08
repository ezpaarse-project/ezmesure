<template>
  <v-chip
    :text="statusText"
    size="small"
    :color="color"
    variant="outlined"
  />
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: undefined,
  },
});

const colors = new Map([
  ['created', 'success'],
  ['updated', 'warning'],
  ['deleted', 'error'],
  ['error', 'error'],
]);
const { t } = useI18n();

const status = computed(() => props.item?.status);
const statusText = computed(() => t(`statuses.${status.value}`));
const color = computed(() => colors.get(status.value));
</script>
