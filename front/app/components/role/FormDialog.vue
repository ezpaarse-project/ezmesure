<template>
  <v-dialog
    v-model="isOpen"
    :max-width="dialogMaxWidth"
    scrollable
    persistent
  >
    <LoaderCard v-if="loading" />

    <v-card v-else-if="errorMessage">
      <v-empty-state
        :icon="errorIcon"
        :title="errorMessage"
      >
        <template #actions>
          <v-btn
            :text="$t('close')"
            variant="text"
            @click="isOpen = false"
          />

          <v-btn
            :text="$t('retry')"
            :loading="loading"
            variant="elevated"
            color="secondary"
            @click="refreshForm"
          />
        </template>
      </v-empty-state>
    </v-card>

    <RoleForm
      v-else
      :model-value="roleData"
      @submit="onSave($event)"
    >
      <template #actions>
        <v-btn
          :text="$t('cancel')"
          variant="text"
          @click="isOpen = false"
        />
      </template>
    </RoleForm>
  </v-dialog>
</template>

<script setup>
import { getErrorMessage } from '@/lib/errors';

const emit = defineEmits({
  submit: (item) => !!item,
});

const { t } = useI18n();

const isOpen = shallowRef(false);
const roleId = shallowRef(null);

const roleData = ref(null);
const loading = shallowRef(false);
const errorMessage = shallowRef('');
const errorIcon = shallowRef('');
const dialogMaxWidth = computed(() => {
  if (loading.value) { return 200; }
  if (errorMessage.value) { return 500; }
  return 900;
});

async function refreshForm() {
  if (!roleId.value) {
    return;
  }

  loading.value = true;

  try {
    roleData.value = await $fetch(`/api/roles/${roleId.value}`);
  } catch (err) {
    errorMessage.value = getErrorMessage(err, t('anErrorOccurred'));
    errorIcon.value = err?.statusCode === 404 ? 'mdi-file-hidden' : 'mdi-alert-circle';
  }

  loading.value = false;
}

async function open(role) {
  roleData.value = null;
  loading.value = false;
  errorMessage.value = '';
  errorIcon.value = '';

  roleId.value = role?.id;
  isOpen.value = true;
  await refreshForm();
}

function onSave(role) {
  emit('submit', role);
  isOpen.value = false;
}

defineExpose({
  open,
});
</script>
