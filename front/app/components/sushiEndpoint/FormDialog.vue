<template>
  <v-dialog
    v-model="isOpen"
    width="1000"
    scrollable
    persistent
  >
    <SushiEndpointForm
      :model-value="endpoint"
      show-endpoint
      @submit="onSave($event)"
      @update:model-value="$emit('update:model-value', $event)"
    >
      <template #actions="{ loading }">
        <v-btn
          :text="$t('cancel')"
          :disabled="loading"
          variant="text"
          @click="isOpen = false"
        />
      </template>
    </SushiEndpointForm>
  </v-dialog>
</template>

<script setup>
const emit = defineEmits({
  submit: (item) => !!item,
  'update:model-value': (item) => !!item?.connection?.status,
});

const isOpen = shallowRef(false);
/** @type {Ref<object | undefined>} */
const endpoint = ref(undefined);

async function open(e) {
  endpoint.value = e;
  isOpen.value = true;
}

function onSave(s) {
  emit('submit', s);
  isOpen.value = false;
}

defineExpose({
  open,
});
</script>
