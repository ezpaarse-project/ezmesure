<template>
  <v-dialog
    :model-value="isOpen"
    width="600"
    @update:model-value="close()"
  >
    <InstitutionComponents
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
    </InstitutionComponents>
  </v-dialog>
</template>

<script setup>
const emit = defineEmits({
  'update:modelValue': (components) => !!components,
});

const isOpen = shallowRef(false);
const hasChanged = shallowRef(false);
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
