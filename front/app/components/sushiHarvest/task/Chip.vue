<template>
  <v-chip
    :prepend-icon="icon.icon"
    :color="icon.color"
    :text="text"
    size="small"
    label
  />
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const { t, te } = useI18n();

const icon = computed(() => harvestStatus.get(props.modelValue.status) ?? { color: 'grey' });
const lastStep = computed(() => props.modelValue.steps?.at(-1));
const text = computed(() => {
  if (props.modelValue.status === 'error' && lastStep.value?.status !== 'finished') {
    const sushiCode = lastStep.value?.data?.sushiErrorCode;
    if (sushiCode) {
      const key = `sushiHarvest.errors.${sushiCode}`;
      if (te(key)) {
        return t(key);
      }
    }

    const translateKey = `tasks.failedStep.${lastStep.value?.label}`;
    if (te(translateKey)) {
      return t(translateKey);
    }
  }

  const key = `tasks.status.${props.modelValue.status}`;
  if (te(key)) {
    return t(key);
  }
  return props.modelValue.status;
});
</script>
