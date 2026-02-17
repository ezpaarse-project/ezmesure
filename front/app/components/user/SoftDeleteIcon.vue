<template>
  <v-tooltip v-if="modelValue.deletedAt" location="start">
    <template #activator="{ props: tooltip }">
      <v-icon
        icon="mdi-delete"
        color="grey"
        v-bind="tooltip"
      />
    </template>

    <i18n-t keypath="users.user.deletedAt:tooltip">
      <template #date>
        <LocalDate :model-value="modelValue.deletedAt" format="PPP" />
      </template>
    </i18n-t>
  </v-tooltip>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});
</script>
