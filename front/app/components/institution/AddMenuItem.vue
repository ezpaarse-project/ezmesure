<template>
  <v-list-item
    :title="modelValue.name"
    :subtitle="modelValue.acronym"
    prepend-icon="mdi-account-circle"
    lines="two"
  >
    <template #prepend>
      <InstitutionAvatar :institution="modelValue" />
    </template>

    <template #append>
      <v-btn
        :disabled="isAlreadyAssigned"
        :loading="loading"
        icon="mdi-office-building-plus"
        color="primary"
        variant="tonal"
        size="small"
        @click="$emit('click', $event)"
      />
    </template>
  </v-list-item>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  list: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits({
  click: () => true,
});

const isAlreadyAssigned = computed(
  () => props.list.some((institution) => institution.id === props.modelValue.id),
);
</script>
