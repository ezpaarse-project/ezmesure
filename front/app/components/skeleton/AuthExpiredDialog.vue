<template>
  <v-dialog v-model="show" width="400" persistent>
    <v-card :title="$t('authenticate.expired.confirm.title')" :text="$t('authenticate.expired.confirm.text')">
      <template #actions>
        <v-spacer />

        <v-btn
          :text="$t('authenticate.expired.confirm.actions.disagree')"
          size="small"
          variant="text"
          @click=" disagree()"
        />
        <v-btn
          :text="$t('authenticate.expired.confirm.actions.agree')"
          prepend-icon="mdi-login"
          size="small"
          color="primary"
          @click="agree()"
        />
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
const { signOut } = useAuthStore();
const dialogStore = useDialogStore();
const { show } = storeToRefs(dialogStore);

async function agree() {
  dialogStore.closeDialog();
  await navigateTo('/authenticate');
}

async function disagree() {
  dialogStore.closeDialog();
  await signOut({ local: true });
  await navigateTo('/');
}
</script>
