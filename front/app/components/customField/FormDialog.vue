<template>
  <v-dialog
    v-model="isOpen"
    width="800"
    scrollable
    persistent
  >
    <CustomFieldForm
      :model-value="field"
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
    </CustomFieldForm>
  </v-dialog>
</template>

<script setup>
const emit = defineEmits({
  submit: (item) => !!item,
  'update:model-value': (item) => !!item,
});

const isOpen = shallowRef(false);
/** @type {Ref<object | undefined>} */
const field = ref(undefined);

async function open(u) {
  field.value = u;
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
