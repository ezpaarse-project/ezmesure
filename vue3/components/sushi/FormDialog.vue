<template>
  <v-dialog
    v-model="isOpen"
    width="800"
    scrollable
    persistent
  >
    <SushiForm
      :model-value="sushi"
      :institution="institution"
      show-sushi
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
    </SushiForm>
  </v-dialog>
</template>

<script setup>
const emit = defineEmits({
  submit: (item) => !!item,
  'update:model-value': (item) => !!item?.connection?.status,
});

const isOpen = ref(false);
/** @type {Ref<object | undefined>} */
const sushi = ref(undefined);
/** @type {Ref<object | undefined>} */
const institution = ref(undefined);

async function open(s, opts) {
  sushi.value = s;
  institution.value = opts.institution;
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
