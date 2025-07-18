<template>
  <v-dialog
    v-model="isOpen"
    width="800"
    scrollable
  >
    <SushiReports :sushi="sushi" show-sushi>
      <template #actions>
        <v-btn
          :text="$t('close')"
          variant="text"
          @click="isOpen = false"
        />
      </template>
    </SushiReports>
  </v-dialog>
</template>

<script setup>
const isOpen = ref(false);
/** @type {Ref<object | undefined>} */
const sushi = ref(undefined);

async function open(s) {
  sushi.value = s;
  isOpen.value = true;
}

defineExpose({
  open,
});
</script>
