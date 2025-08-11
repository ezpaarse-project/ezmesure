<template>
  <v-dialog
    :model-value="isOpen"
    width="600"
    @update:model-value="close()"
  >
    <UserImpersonate
      :user="user"
      show-user
    >
      <template #actions>
        <v-btn
          :text="$t('close')"
          variant="text"
          @click="close()"
        />
      </template>
    </UserImpersonate>
  </v-dialog>
</template>

<script setup>
const isOpen = shallowRef(false);
/** @type {Ref<object | undefined>} */
const user = ref(undefined);

async function open(s) {
  user.value = s;
  isOpen.value = true;
}

function close() {
  isOpen.value = false;
}

defineExpose({
  open,
});
</script>
