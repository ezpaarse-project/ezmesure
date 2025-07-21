<template>
  <v-chip
    v-tooltip="content.tooltip"
    :text="content.text"
    :prepend-icon="content.icon"
    :color="content.color"
    variant="text"
  />
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const { t, locale } = useI18n();

const content = computed(() => {
  if (props.modelValue.deletedAt) {
    return {
      text: t('deleted'),
      tooltip: t('deletedSince', { date: dateFormat(props.modelValue.deletedAt, locale.value) }),
      icon: 'mdi-delete',
      color: 'red',
    };
  }

  if (props.modelValue.archived) {
    return {
      text: t('archived'),
      tooltip: t('archivedSince', { date: dateFormat(props.modelValue.archivedUpdatedAt, locale.value) }),
      icon: 'mdi-archive',
      color: 'blue',
    };
  }

  if (!props.modelValue.active) {
    return {
      text: t('inactive'),
      tooltip: t('endpoints.inactiveSince', { date: dateFormat(props.modelValue.activeUpdatedAt, locale.value) }),
      icon: 'mdi-close',
    };
  }

  return {
    text: t('active'),
    tooltip: t('endpoints.activeSince', { date: dateFormat(props.modelValue.activeUpdatedAt, locale.value) }),
    icon: 'mdi-check',
    color: 'green',
  };
});
</script>
