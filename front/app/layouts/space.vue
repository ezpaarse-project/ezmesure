<template>
  <v-main>
    <SkeletonSpaceMenu />
    <slot />
  </v-main>
</template>

<script setup>
const snackbarStore = useSnacksStore();
const currentUserStore = useCurrentUserStore();

const { error } = await useAsyncData('currentMemberships', () => currentUserStore.fetchMemberships());
if (error.value) {
  snackbarStore.error(error.value.message);
}
</script>
