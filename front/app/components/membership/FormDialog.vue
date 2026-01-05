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

    <MembershipForm
      v-else
      :model-value="membershipData"
      @update:model-value="onSave()"
    >
      <template #actions="{ loading: formLoading }">
        <v-btn
          :text="$t('close')"
          :disabled="formLoading"
          variant="text"
          @click="isOpen = false"
        />
      </template>
    </MembershipForm>
  </v-dialog>
</template>

<script setup>
import { getErrorMessage } from '@/lib/errors';

const emit = defineEmits({
  'update:modelValue': (item) => !!item,
});

const { t } = useI18n();

const isOpen = shallowRef(false);
const username = shallowRef(null);
const institutionId = shallowRef(null);

const membershipData = ref(null);
const loading = shallowRef(false);
const errorMessage = shallowRef('');
const errorIcon = shallowRef('');

const dialogMaxWidth = computed(() => {
  if (loading.value) { return 200; }
  if (errorMessage.value) { return 500; }
  return 900;
});

async function refreshForm() {
  if (!institutionId.value || !username.value) {
    return;
  }

  loading.value = true;

  try {
    membershipData.value = await $fetch(`/api/institutions/${institutionId.value}/memberships/${username.value}`, {
      query: {
        include: [
          'institution',
          'user',
          'roles.role',
          'spacePermissions',
          'repositoryPermissions',
          'repositoryAliasPermissions',
        ],
      },
    });
  } catch (err) {
    errorMessage.value = getErrorMessage(err, t('anErrorOccurred'));
    errorIcon.value = err?.statusCode === 404 ? 'mdi-file-hidden' : 'mdi-alert-circle';
  }

  loading.value = false;
}

async function open(membership) {
  membershipData.value = null;
  loading.value = false;
  errorMessage.value = '';
  errorIcon.value = '';

  institutionId.value = membership?.institutionId;
  username.value = membership?.username;
  isOpen.value = true;
  await refreshForm();
}

function onSave() {
  emit('update:modelValue', membershipData.value);
}

defineExpose({
  open,
});
</script>
