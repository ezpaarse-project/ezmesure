<template>
  <component
    :is="dialogStore.component"
    v-if="dialogStore.component"
    v-model="dialogStore.show"
    v-bind="{ ...$attrs, ...dialogStore.data }"
    v-on="dialogStore.listeners ?? {}"
  />
</template>

<script setup>
const dialogStore = useDialogStore();
</script>
