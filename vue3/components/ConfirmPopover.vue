<template>
  <v-menu
    v-model="show"
    :close-on-content-click="false"
    :persistent="loading"
    v-bind="$attrs"
    @update:model-value="$event || cancel()"
  >
    <template #activator="scope">
      <slot name="activator" v-bind="scope" />
    </template>

    <v-card
      :title="title"
      :text="text"
    >
      <template #actions>
        <v-spacer />

        <v-btn
          :text="disagreeText || $t('cancel')"
          :prepend-icon="disagreeIcon"
          :disabled="confirmLoading"
          :loading="cancelLoading"
          size="small"
          variant="text"
          @click="cancel()"
        />
        <v-btn
          :text="agreeText || $t('confirm')"
          :prepend-icon="agreeIcon"
          :disabled="cancelLoading"
          :loading="confirmLoading"
          size="small"
          color="primary"
          @click="confirm()"
        />
      </template>
    </v-card>
  </v-menu>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: undefined,
  },
  text: {
    type: String,
    default: undefined,
  },
  agreeText: {
    type: String,
    default: '',
  },
  agreeIcon: {
    type: String,
    default: '',
  },
  agree: {
    type: Function,
    default: () => {},
  },
  disagreeText: {
    type: String,
    default: '',
  },
  disagreeIcon: {
    type: String,
    default: '',
  },
  disagree: {
    type: Function,
    default: () => {},
  },
});

const show = ref(false);
const confirmLoading = ref(false);
const cancelLoading = ref(false);

const loading = computed(() => confirmLoading.value || cancelLoading.value);

async function confirm() {
  confirmLoading.value = true;
  try {
    await props.agree();
  } finally {
    confirmLoading.value = false;
    show.value = false;
  }
}

async function cancel() {
  cancelLoading.value = true;
  try {
    await props.disagree();
  } finally {
    cancelLoading.value = false;
    show.value = false;
  }
}

defineExpose({
  confirm,
  cancel,
});
</script>
