<template>
  <v-dialog
    v-model="isOpen"
    width="1000"
    scrollable
  >
    <SushiHarvestTaskHistory
      :task="task"
      :session="session"
      show-task
    >
      <template #actions>
        <v-btn
          :text="$t('close')"
          variant="text"
          @click="isOpen = false"
        />
      </template>
    </SushiHarvestTaskHistory>
  </v-dialog>
</template>

<script setup>
defineProps({
  session: {
    type: Object,
    required: true,
  },
});

const isOpen = ref(false);
/** @type {Ref<object | undefined>} */
const task = ref(undefined);

async function open(s) {
  task.value = s;
  isOpen.value = true;
}

defineExpose({
  open,
});
</script>
