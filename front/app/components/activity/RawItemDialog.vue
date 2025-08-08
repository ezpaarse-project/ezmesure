<template>
  <v-dialog
    v-model="isOpen"

    width="1000"
    scrollable
  >
    <v-card>
      <template #text>
        <pre>{{ rawItem }}</pre>
      </template>

      <template #actions>
        <v-btn
          :text="$t('close')"
          variant="text"
          @click="isOpen = false"
        />
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
const isOpen = shallowRef(false);
/** @type {Ref<object | undefined>} */
const rawItem = ref(undefined);

async function open(item) {
  rawItem.value = JSON.stringify(item, null, 2);
  isOpen.value = true;
}

defineExpose({
  open,
});
</script>
