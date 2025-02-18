<template>
  <v-dialog
    :model-value="isOpen"
    width="500"
    @update:model-value="isOpen = false"
  >
    <ElasticRoleForm
      :model-value="role"
      @submit="onSave($event)"
    >
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
/** @type {Ref<object|null>} */
const role = ref(null);

function open(elasticRole) {
  role.value = elasticRole;
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
