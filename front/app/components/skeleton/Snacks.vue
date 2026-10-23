<template>
  <v-snackbar
    v-model="visible"
    location="bottom right"
    :color="currentMessages?.color"
    :timeout="currentMessages?.timeout"
    transition="slide-y-reverse-transition"
  >
    <div v-if="currentMessages?.title" class="text-title-large pb-2">
      {{ currentMessages.title }}
    </div>

    <div class="text-body-medium">
      {{ currentMessages?.text }}
    </div>

    <template #actions>
      <v-btn
        icon="$mdi-window-close"
        variant="text"
        right
        @click="visible = false"
      />
    </template>
  </v-snackbar>
</template>

<script setup>
const snackStore = useSnacksStore();

const visible = shallowRef(false);

const { messages } = storeToRefs(snackStore);

const currentMessages = computed(() => messages.value[0]);

watch(
  messages.value,
  () => {
    if (!visible.value && messages.value.length) {
      visible.value = true;
    }
  },
);

watch(
  visible,
  () => {
    if (visible.value || !messages.value.length) {
      return;
    }
    setTimeout(() => {
      snackStore.removeMessage();
    }, 200);
  },
);

</script>
