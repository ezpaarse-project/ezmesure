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

    <RepositoryAliasTemplateForm
      v-else
      :model-value="item"
      @update:model-value="onSave($event)"
    >
      <template #actions>
        <v-btn
          :text="$t('cancel')"
          variant="text"
          @click="isOpen = false"
        />
      </template>
    </RepositoryAliasTemplateForm>
  </v-dialog>
</template>

<script setup>
import { getErrorMessage } from '@/lib/errors';

const emit = defineEmits({
  submit: (item) => !!item,
});

const { t } = useI18n();

const isOpen = ref(false);
const itemId = ref(null);

const item = ref(null);
const loading = ref(false);
const errorMessage = ref('');
const errorIcon = ref('');

const dialogMaxWidth = computed(() => {
  if (loading.value) { return 200; }
  if (errorMessage.value) { return 500; }
  return 700;
});

async function refreshForm() {
  if (!itemId.value) {
    return;
  }

  loading.value = true;

  try {
    item.value = await $fetch(`/api/repository-alias-templates/${itemId.value}`, {
      query: {
        include: 'repository',
      },
    });
  } catch (err) {
    errorMessage.value = getErrorMessage(err) || t('anErrorOccurred');
    errorIcon.value = err?.statusCode === 404 ? 'mdi-file-hidden' : 'mdi-alert-circle';
  }

  loading.value = false;
}

async function open(id) {
  item.value = null;
  loading.value = false;
  errorMessage.value = '';
  errorIcon.value = '';

  itemId.value = id;
  isOpen.value = true;
  await refreshForm();
}

function onSave(institution) {
  emit('submit', institution);
  isOpen.value = false;
}

defineExpose({
  open,
});
</script>
