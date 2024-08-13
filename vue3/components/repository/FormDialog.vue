<template>
  <v-dialog
    v-model="isOpen"
    :width="institution ? 600 : 400"
    scrollable
    persistent
  >
    <RepositoryForm
      ref="repositoryFormRef"
      :completion="completion"
      :institution="institution"
      @submit="onSave($event)"
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
  submit: (item) => !!item,
});

const isOpen = ref(false);
/** @type {Ref<object | undefined>} */
const institution = ref(undefined);

/** @type {Ref<object | null>} Vue ref of the repository form */
const repositoryFormRef = ref(null);

async function open(opts) {
  institution.value = opts?.institution;
  isOpen.value = true;
}

function onSave(repository) {
  emit('submit', repository);
  isOpen.value = false;
}

defineExpose({
  open,
});
</script>
