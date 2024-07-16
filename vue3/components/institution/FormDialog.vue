<template>
  <v-dialog
    v-model="isOpen"
    width="900"
    scrollable
    persistent
  >
    <InstitutionForm
      ref="institutionFormRef"
      @update:model-value="onSave"
    >
      <template #actions>
        <v-btn
          :text="$t('cancel')"
          variant="text"
          @click="isOpen = false"
        />
      </template>
    </InstitutionForm>
  </v-dialog>
</template>

<script setup>
const isOpen = ref(false);

const emit = defineEmits({
  'update:modelValue': (item) => !!item,
});

/** @type {Ref<Object | null>} Vue ref of the institution form */
const institutionFormRef = ref(null);

async function open(institution, opts) {
  isOpen.value = true;
  await nextTick();
  institutionFormRef.value?.init(institution, opts);
}

function onSave(institution) {
  emit('update:modelValue', institution);
  isOpen.value = false;
}

defineExpose({
  open,
});
</script>
