<template>
  <v-dialog
    :model-value="dialogStore.show"
    max-width="400"
    v-bind="$attrs"
    @update:model-value="cancel()"
  >
    <v-card
      :title="dialogStore.data.title || $t('areYouSure')"
      :text="dialogStore.data.text"
    >
      <template #actions>
        <v-spacer />

        <v-btn
          :text="dialogStore.data.disagreeText || $t('cancel')"
          :prepend-icon="dialogStore.data.disagreeIcon"
          :disabled="agreeLoading"
          :loading="disagreeLoading"
          size="small"
          variant="text"
          @click="cancel()"
        />
        <v-btn
          :text="dialogStore.data.agreeText || $t('confirm')"
          :prepend-icon="dialogStore.data.agreeIcon"
          :disabled="disagreeLoading"
          :loading="agreeLoading"
          size="small"
          color="primary"
          @click="agree()"
        />
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
const dialogStore = useDialogStore();

const disagreeLoading = shallowRef(false);
const agreeLoading = shallowRef(false);

async function cancel() {
  disagreeLoading.value = true;
  await dialogStore.data.onDisagree?.();
  dialogStore.closeConfirm(false);
  disagreeLoading.value = false;
}

async function agree() {
  agreeLoading.value = true;
  await dialogStore.data.onAgree?.();
  dialogStore.closeConfirm(true);
  agreeLoading.value = false;
}
</script>
