<template>
  <v-snackbar
    :model-value="isTesting"
    :text="$t('sushi.checking', { vendor: currentlyTesting?.vendor })"
    location="bottom left"
    color="info"
    position="fixed"
    width="600"
    timeout="-1"
  >
    <v-progress-linear :model-value="progress" class="mt-2" />

    <template #actions>
      <v-icon icon="mdi-key" start />
    </template>
  </v-snackbar>
</template>

<script setup>
const { idsInQueue, currentlyTesting, isTesting } = storeToRefs(useSushiCheckQueueStore());

const total = ref(0);
const last = ref(0);
const progress = ref(0);

watch(idsInQueue, (v) => {
  if (v.size > last.value) {
    total.value = v.size;
  }
  last.value = v.size;
  progress.value = 110 - ((last.value / total.value) * 100);
});
</script>
