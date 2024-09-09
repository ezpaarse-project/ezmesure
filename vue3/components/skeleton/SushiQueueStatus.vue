<template>
  <v-snackbar
    :model-value="!!currentlyTesting"
    location="bottom left"
    color="info"
    position="fixed"
    width="600"
    timeout="-1"
  >
    <template #text>
      <i18n-t keypath="sushi.checking">
        <template #vendor>
          <b>{{ currentlyTesting?.vendor }}</b>
        </template>

        <template #name>
          <b>{{ currentlyTesting?.name }}</b>
        </template>
      </i18n-t>

      <v-progress-linear :model-value="progress" class="mt-2" />
    </template>

    <template #actions>
      <v-avatar :icon="status.icon" :color="status.color" border="0" start />
    </template>
  </v-snackbar>
</template>

<script setup>
const { idsInQueue, currentlyTesting } = storeToRefs(useSushiCheckQueueStore());

const total = ref(0);
const last = ref(0);
const progress = ref(0);

const status = computed(() => sushiStatus.get(currentlyTesting.value?.status) || { icon: 'mdi-key', color: 'info' });

watch(idsInQueue, (v) => {
  if (v.size > last.value) {
    total.value = v.size;
  }
  last.value = v.size;
  progress.value = 110 - ((last.value / total.value) * 100);
});
</script>
