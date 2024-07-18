<template>
  <v-dialog
    v-model="isOpen"
    width="400"
    scrollable
    persistent
  >
    <RepositoryForm
      ref="repositoryFormRef"
      :completion="completion"
      @update:model-value="onSave"
    >
      <template #actions>
        <v-btn
          :text="$t('cancel')"
          variant="text"
          @click="isOpen = false"
        />
      </template>
    </RepositoryForm>
  </v-dialog>
</template>

<script setup>
defineProps({
  completion: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  'update:modelValue': (item) => !!item,
});

const isOpen = ref(false);

/** @type {Ref<object | null>} Vue ref of the repository form */
const repositoryFormRef = ref(null);

async function open(opts) {
  isOpen.value = true;
  await nextTick();
  repositoryFormRef.value?.init(opts);
}

function onSave(repository) {
  emit('update:modelValue', repository);
  isOpen.value = false;
}

defineExpose({
  open,
});
</script>
