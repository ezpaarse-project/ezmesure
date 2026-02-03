<template>
  <v-list>
    <v-list-item
      :title="$t('modify')"
      prepend-icon="mdi-pencil"
      @click="updateUser()"
    />
    <v-list-item
      v-if="!!user.deletedAt"
      :title="$t('delete')"
      prepend-icon="mdi-delete"
      @click="deleteUser()"
    />
    <v-list-item
      v-else
      :title="$t('users.actions.disable.title')"
      :disabled="!!user.deletedAt"
      prepend-icon="mdi-account-cancel"
      @click="disableUser()"
    />

    <v-divider />

    <v-list-item
      :title="$t('users.actions.restore.title')"
      :disabled="!user.deletedAt"
      prepend-icon="mdi-account-check"
      @click="restoreUser()"
    />

    <v-list-item
      :title="$t('authenticate.impersonate')"
      prepend-icon="mdi-login"
      @click="impersonateUser()"
    />
    <v-list-item
      v-if="clipboard"
      :title="$t('users.createMailUserList')"
      prepend-icon="mdi-email"
      @click="copyUserEmail(user)"
    />
  </v-list>
</template>

<script setup>
import { millisecondsInDay } from 'date-fns/constants';

import UserFormDialog from '~/components/user/FormDialog.vue';
import ImpersonateDialog from '~/components/user/ImpersonateDialog.vue';

const { data: apiConfig } = useApiConfig();
const { openDialog } = useDialogStore();
const { openConfirm } = useConfirmStore();
const snacks = useSnacksStore();
const { isSupported: clipboard, copy } = useClipboard();
const { t, locale } = useI18n();

const user = defineModel({ type: Object, required: true });

const props = defineProps({
  onChange: {
    type: Function,
    default: () => {},
  },
});

const deleteDuration = computed(() => {
  const deleteDurationDays = apiConfig?.value?.users?.deleteDurationDays;
  return timeAgo(deleteDurationDays * millisecondsInDay, locale.value) ?? '...';
});

function updateUser() {
  openDialog({
    component: UserFormDialog,
    data: {
      username: user.value.username,
    },
    listeners: {
      submit: () => {
        props.onChange?.();
      },
    },
  });
}

function deleteUser() {
  openConfirm({
    title: t('areYouSure'),
    text: t('users.actions.delete.confirm.text', {
      name: user.value.fullName,
      count: 1,
    }),
    agreeText: t('users.actions.delete.title'),
    onAgree: async () => {
      try {
        await $fetch(`/api/users/${user.value.username}`, { method: 'DELETE', query: { force: true } });
      } catch (err) {
        snacks.error(t('anErrorOccurred'), err);
        return;
      }

      snacks.success(t('users.actions.delete.success', { count: 1 }));
      props.onChange?.();
    },
  });
}

function disableUser() {
  openConfirm({
    title: t('areYouSure'),
    text: t('users.actions.disable.confirm.text', {
      name: user.value.fullName,
      duration: deleteDuration.value,
      count: 1,
    }),
    agreeText: t('users.actions.disable.title'),
    onAgree: async () => {
      try {
        await $fetch(`/api/users/${user.value.username}`, { method: 'DELETE' });
      } catch (err) {
        snacks.error(t('anErrorOccurred'), err);
        return;
      }

      snacks.success(t('users.actions.disable.success', { count: 1 }));
      props.onChange?.();
    },
  });
}

function restoreUser() {
  openConfirm({
    title: t('areYouSure'),
    text: t('users.actions.restore.confirm.text', {
      name: user.value.fullName,
      count: 1,
    }),
    agreeText: t('users.actions.restore.title'),
    onAgree: async () => {
      try {
        await $fetch(`/api/users/${user.value.username}`, { method: 'PATCH', body: { deletedAt: null } });
      } catch (err) {
        snacks.error(t('anErrorOccurred'), err);
        return;
      }

      snacks.success(t('users.actions.restore.success', { count: 1 }));
      props.onChange?.();
    },
  });
}

function impersonateUser() {
  openDialog({
    component: ImpersonateDialog,
    data: {
      user: user.value,
    },
  });
}

/**
 * Put user email into the clipboard
 */
async function copyUserEmail() {
  if (!user.value?.email) {
    return;
  }

  try {
    await copy(user.value.email);
  } catch (err) {
    snacks.error(t('clipboard.unableToCopy'), err);
    return;
  }
  snacks.info(t('clipboard.textCopied'));
}
</script>
