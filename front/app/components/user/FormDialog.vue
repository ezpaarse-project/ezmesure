<template>
  <v-dialog
    v-model="isOpen"
    width="800"
    scrollable
    persistent
  >
    <UserForm
      :model-value="user"
      show-user
      @submit="onSave($event)"
      @update:model-value="$emit('update:model-value', $event)"
    >
      <template #actions="{ loading }">
        <v-btn
          :text="$t('cancel')"
          :disabled="loading"
          variant="text"
          @click="isOpen = false"
        />
      </template>
    </UserForm>
  </v-dialog>
</template>

<script setup>
const emit = defineEmits({
  submit: (item) => !!item,
  'update:model-value': (item) => !!item?.connection?.status,
});

const isOpen = shallowRef(false);
/** @type {Ref<object | undefined>} */
const user = ref(undefined);

async function open(u) {
  user.value = u;
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
