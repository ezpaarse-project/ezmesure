<template>
  <v-dialog
    :model-value="isOpen"
    width="500"
    @update:model-value="close()"
  >
    <ElasticRoleUsers
      :role="role"
      show-role
      @update:model-value="hasChanged = true"
    >
      <template #actions>
        <v-btn
          :text="$t('close')"
          variant="text"
          @click="close()"
        />
      </template>
    </ElasticRoleUsers>
  </v-dialog>
</template>

<script setup>
const emit = defineEmits({
  'update:modelValue': () => true,
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
