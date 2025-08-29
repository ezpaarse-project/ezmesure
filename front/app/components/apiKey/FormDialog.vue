<template>
  <v-dialog
    v-model="isOpen"
    width="800"
    scrollable
    persistent
  >
    <ApiKeyForm
      :model-value="apiKey"
      :institution="institution"
      :user="user"
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
    </ApiKeyForm>
  </v-dialog>
</template>

<script setup>
const emit = defineEmits({
  submit: (item) => !!item,
});

const isOpen = shallowRef(false);
/** @type {Ref<object | undefined>} */
const apiKey = ref(undefined);
/** @type {Ref<object | undefined>} */
const institution = ref(undefined);
/** @type {Ref<object | undefined>} */
const user = ref(undefined);

async function open(s, opts) {
  apiKey.value = s;
  institution.value = opts?.institution;
  user.value = opts?.user;
  isOpen.value = true;
}

function onSave(s) {
  emit('submit', s);
  isOpen.value = false;
}

defineExpose({
  open,
});
</script>
