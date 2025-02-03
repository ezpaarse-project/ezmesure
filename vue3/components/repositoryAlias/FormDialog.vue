<template>
  <v-dialog
    v-model="isOpen"
    :width="institution ? 1100 : 400"
    scrollable
    persistent
  >
    <RepositoryAliasForm
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
    </RepositoryAliasForm>
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

async function open(opts) {
  institution.value = opts?.institution;
  isOpen.value = true;
}

function onSave(alias) {
  emit('submit', alias);
  isOpen.value = false;
}

defineExpose({
  open,
});
</script>
