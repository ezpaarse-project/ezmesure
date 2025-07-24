<template>
  <v-dialog
    v-model="isOpen"
    width="1400"
    scrollable
  >
    <SushiHarvestMatrix
      :sushi="sushi"
      :period="period"
      show-sushi
    >
      <template #actions>
        <v-btn
          :text="$t('close')"
          variant="text"
          @click="isOpen = false"
        />
      </template>
    </SushiHarvestMatrix>
  </v-dialog>
</template>

<script setup>
const isOpen = shallowRef(false);
/** @type {Ref<object | undefined>} */
const sushi = ref(undefined);
/** @type {Ref<string | undefined>} */
const period = ref(undefined);

async function open(s, opts) {
  sushi.value = s;
  period.value = opts?.period;
  isOpen.value = true;
}

defineExpose({
  open,
});
</script>
