<template>
  <v-dialog
    :model-value="isOpen"
    width="600"
    @update:model-value="close()"
  >
    <UserMemberships
      :user="user"
      show-user
      @update:model-value="hasChanged = true"
    >
      <template #actions>
        <v-btn
          :text="$t('close')"
          variant="text"
          @click="close()"
        />
      </template>
    </UserMemberships>
  </v-dialog>
</template>

<script setup>
const emit = defineEmits({
  'update:modelValue': (item) => !!item,
});

const isOpen = shallowRef(false);
const hasChanged = shallowRef(false);
/** @type {Ref<object | undefined>} */
const user = ref(undefined);

async function open(s) {
  user.value = s;
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
