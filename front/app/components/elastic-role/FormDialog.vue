<template>
  <v-dialog
    :model-value="isOpen"
    width="500"
    @update:model-value="isOpen = false"
  >
    <ElasticRoleForm @submit="onSave($event)">
      <template #actions>
        <v-btn
          :text="$t('close')"
          variant="text"
          @click="isOpen = false"
        />
      </template>
    </ElasticRoleForm>
  </v-dialog>
</template>

<script setup>
const emit = defineEmits({
  submit: () => true,
});

const isOpen = ref(false);
const hasChanged = ref(false);

function open() {
  hasChanged.value = false;
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
