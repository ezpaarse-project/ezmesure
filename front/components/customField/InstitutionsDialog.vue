<template>
  <v-dialog
    v-model="isOpen"
    :width="loading ? 200 : 900"
    scrollable
  >
    <LoaderCard v-if="loading" />

    <v-card
      v-else
      :title="$t('institutions.toolbarTitle', { count: fieldData.length })"
      :subtitle="fieldLabel"
    >
      <v-empty-state
        v-if="errorMessage"
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

      <v-data-table
        v-else
        v-model:sort-by="sortBy"
        :headers="headers"
        :items="fieldData?.institutionProperties ?? []"
        :loading="loading"
        :sort-by="['institution.name']"
        density="comfortable"
      />
    </v-card>
  </v-dialog>
</template>

<script setup>
import { getErrorMessage } from '@/lib/errors';

const { t, locale } = useI18n();

const isOpen = ref(false);
const fieldId = ref(null);

const fieldData = ref(null);
const loading = ref(false);
const errorMessage = ref('');
const errorIcon = ref('');

const fieldLabel = computed(() => (fieldData.value?.[locale.value === 'en' ? 'labelEn' : 'labelFr']));

const sortBy = ref([{ key: 'institution.name', order: 'asc' }]);

const headers = computed(() => [
  {
    title: t('name'),
    value: 'institution.name',
    sortable: true,
  },
  {
    title: t('value'),
    value: 'value',
  },
]);

async function refreshForm() {
  if (!fieldId.value) {
    return;
  }

  loading.value = true;

  try {
    fieldData.value = await $fetch(`/api/custom-fields/${fieldId.value}`, {
      query: {
        include: 'institutionProperties.institution',
      },
    });
  } catch (err) {
    errorMessage.value = getErrorMessage(err, t('anErrorOccurred'));
    errorIcon.value = err?.statusCode === 404 ? 'mdi-file-hidden' : 'mdi-alert-circle';
  }

  loading.value = false;
}

async function open(customField) {
  fieldData.value = null;
  loading.value = false;
  errorMessage.value = '';
  errorIcon.value = '';

  fieldId.value = customField?.id;
  isOpen.value = true;
  await refreshForm();
}

defineExpose({
  open,
});
</script>
