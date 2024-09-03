<template>
  <v-dialog
    v-model="isOpen"
    width="900"
    scrollable
    persistent
  >
    <InstitutionForm
      ref="institutionFormRef"
      show-institution
      @submit="onSave($event)"
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
const emit = defineEmits({
  submit: (item) => !!item,
});

const isOpen = ref(false);

/** @type {Ref<Object | null>} Vue ref of the institution form */
const institutionFormRef = ref(null);

async function open(institution, opts) {
  isOpen.value = true;
  await nextTick();
  institutionFormRef.value?.init(institution, opts);
}

function onSave(institution) {
  emit('submit', institution);
  isOpen.value = false;
}

defineExpose({
  open,
});
</script>
