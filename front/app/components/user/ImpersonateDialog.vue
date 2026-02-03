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
const isOpen = defineModel({ type: Boolean, default: false });

defineProps({
  user: {
    type: Object,
    required: true,
  },
});

function close() {
  isOpen.value = false;
}

</script>
