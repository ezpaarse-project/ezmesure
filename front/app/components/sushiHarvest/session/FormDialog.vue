<template>
  <v-dialog
    v-model="isOpen"
    width="1200"
    scrollable
    persistent
  >
    <SushiHarvestSessionForm
      :model-value="session"
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
    </SushiHarvestSessionForm>
  </v-dialog>
</template>

<script setup>
const emit = defineEmits({
  submit: (item) => !!item,
});

const isOpen = shallowRef(false);
/** @type {Ref<object | undefined>} */
const session = ref(undefined);

async function open(s) {
  session.value = s;
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
