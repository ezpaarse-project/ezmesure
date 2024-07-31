<template>
  <v-dialog
    :model-value="isOpen"
    width="600"
    @update:model-value="close()"
  >
    <InstitutionSpaces
      ref="institutionSpacesRef"
      :institution="institution"
      show-institution
      @update:model-value="hasChanged = true"
    >
      <template #actions>
        <v-btn
          text
          @click="close()"
        >
          {{ $t('close') }}
        </v-btn>
      </template>
    </InstitutionSpaces>
  </v-dialog>
</template>

<script setup>
const emit = defineEmits({
  'update:modelValue': (spaces) => !!spaces,
});

const isOpen = ref(false);
const hasChanged = ref(false);
/** @type {Ref<object|null>} */
const institution = ref(null);

/** @type {Ref<Object | null>} Vue ref of the component list */
const institutionSpacesRef = ref(null);

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
