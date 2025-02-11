<template>
  <v-dialog
    :model-value="isOpen"
    width="600"
    @update:model-value="close()"
  >
    <InstitutionSpaces
      :institution="institution"
      show-institution
      @update:model-value="hasChanged = true"
    >
      <template #actions>
        <v-btn
          :text="$t('close')"
          variant="text"
          @click="close()"
        />
      </template>
    </InstitutionSpaces>
  </v-dialog>
</template>

<script setup>
const emit = defineEmits({
  'update:modelValue': () => true,
});

const isOpen = ref(false);
const hasChanged = ref(false);
/** @type {Ref<object|null>} */
const institution = ref(null);

function open(i) {
  institution.value = i;
  hasChanged.value = false;
  isOpen.value = true;
}

function close() {
  if (hasChanged.value) {
    emit('update:modelValue');
  }
  isOpen.value = false;
}

defineExpose({
  open,
});
</script>
