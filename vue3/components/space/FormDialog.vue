<template>
  <v-dialog
    v-model="isOpen"
    width="1100"
    scrollable
    persistent
  >
    <SpaceForm
      ref="spaceFormRef"
      :model-value="space"
      :institution="institution"
      @update:model-value="onSave"
    >
      <template #actions>
        <v-btn
          :text="$t('cancel')"
          variant="text"
          @click="isOpen = false"
        />
      </template>
    </SpaceForm>
  </v-dialog>
</template>

<script setup>
const emit = defineEmits({
  'update:modelValue': (item) => !!item,
});

const isOpen = ref(false);
/** @type {Ref<object | undefined>} */
const space = ref(undefined);
/** @type {Ref<object | undefined>} */
const institution = ref(undefined);

/** @type {Ref<object | null>} Vue ref of the space form */
const spaceFormRef = ref(null);

async function open(s, opts) {
  space.value = s;
  institution.value = opts.institution;
  isOpen.value = true;
}

function onSave(s) {
  emit('update:modelValue', s);
  isOpen.value = false;
}

defineExpose({
  open,
});
</script>
