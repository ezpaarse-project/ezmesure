<template>
  <v-dialog
    v-model="isOpen"
    :width="loading ? 200 : 900"
    scrollable
  >
    <LoaderCard v-if="loading" />

    <v-card
      v-else
      :title="$t('institutions.toolbarTitle', { count: institutionProperties.length })"
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
        :headers="headers"
        :items="institutionProperties"
        :loading="loading"
        :sort-by="[{ key: 'institution.name', order: 'asc' }]"
        density="comfortable"
      >
        <template #[`item.institution.name`]="{ item }">
          <InstitutionAvatar :institution="item.institution" size="x-small" class="mr-2" />

          <nuxt-link :to="`/admin/institutions/${item.institution.id}`">
            {{ item.institution.name }}
          </nuxt-link>
        </template>
      </v-data-table>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { getErrorMessage } from '@/lib/errors';

const { t, locale } = useI18n();

const isOpen = shallowRef(false);
const fieldId = shallowRef(null);

const fieldData = ref(null);
const loading = shallowRef(false);
const errorMessage = shallowRef('');
const errorIcon = shallowRef('');

const fieldLabel = computed(() => (fieldData.value?.[locale.value === 'en' ? 'labelEn' : 'labelFr']));
const institutionProperties = computed(() => fieldData.value?.institutionProperties ?? []);

const headers = computed(() => [
  {
    title: t('name'),
    value: 'institution.name',
    sortable: true,
    maxWidth: '700px',
  },
  {
    title: t('value'),
    value: 'value',
    maxWidth: '200px',
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
