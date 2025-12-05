<template>
  <v-dialog
    v-model="isOpen"
    width="700"
    scrollable
    persistent
  >
    <RepositoryUpdateForm
      :model-value="repository"
      show-repository
      @submit="onSave($event)"
    >
      <template #actions="{ loading }">
        <v-btn
          :text="$t('cancel')"
          :disabled="loading"
          variant="text"
          @click="isOpen = false"
        />
      </template>
    </RepositoryUpdateForm>
  </v-dialog>
</template>

<script setup>
const emit = defineEmits({
  submit: (item) => !!item,
});

const isOpen = shallowRef(false);
/** @type {Ref<object | undefined>} */
const repository = ref(undefined);

async function open(r) {
  repository.value = r;
  isOpen.value = true;
}

function onSave(r) {
  emit('submit', r);
  isOpen.value = false;
}

defineExpose({
  open,
});
</script>
