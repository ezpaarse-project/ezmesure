<template>
  <v-dialog
    v-model="isOpen"
    :max-width="900"
    scrollable
    persistent
  >
    <v-card :loading="loading">
      <v-card-title>
        {{ t('repoAliasTemplates.applyTemplate', { id: templateId }) }}
      </v-card-title>

      <v-card-subtitle>
        {{ t('repoAliasTemplates.applyTemplateDesc') }}
      </v-card-subtitle>

      <v-card-text v-if="errorMessage">
        <v-alert
          :text="errorMessage"
          icon="mdi-alert-circle"
          type="error"
          density="compact"
          variant="tonal"
        />
      </v-card-text>

      <v-data-table
        v-else
        :headers="headers"
        :items="createdAliases"
        :loading="loading"
        density="compact"
      >
        <template #[`item.status`]="{ item: template }">
          <RepositoryAliasTemplateApplyStatusChip :item="template" />
        </template>

        <template #[`item.data.institutions`]="{ item: template }">
          {{ template.data.institutions?.length ?? 0 }}
        </template>

        <template #no-data>
          <span v-if="!loading" v-text="$t('repoAliasTemplates.applyToSeeAliases')" />
          <span v-else v-text="$t('repoAliasTemplates.applyHadNoEffect')" />
        </template>
      </v-data-table>

      <v-card-actions>
        <v-switch
          v-model="dryRun"
          :label="t('repoAliasTemplates.dryRun')"
          color="primary"
          hide-details
        />

        <v-spacer />

        <v-btn
          :text="$t('close')"
          variant="text"
          @click="close()"
        />

        <v-btn
          :text="$t('apply')"
          :loading="loading"
          variant="elevated"
          color="primary"
          @click="applyTemplate()"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { getErrorMessage } from '@/lib/errors';

const emit = defineEmits({
  close: (applied) => typeof applied === 'boolean',
});

const { t } = useI18n();

const isOpen = ref(false);
const dryRun = ref(false);
const templateId = ref(null);

const result = ref(null);
const loading = ref(false);
const errorMessage = ref('');

const createdAliases = computed(() => result.value?.items ?? []);

/**
 * Table headers
 */
const headers = computed(() => [
  {
    title: t('status'),
    value: 'status',
    sortable: true,
    width: 0,
    nowrap: true,
  },
  {
    title: t('repositories.pattern'),
    value: 'data.pattern',
    sortable: true,
  },
  {
    title: t('repositories.institutions'),
    value: 'data.institutions',
    align: 'end',
    sortable: true,
  },

]);

async function applyTemplate() {
  if (!templateId.value) {
    return;
  }

  loading.value = true;

  try {
    item.value = await $fetch(`/api/repository-alias-templates/${templateId.value}/_apply`, {
      method: 'POST',
      query: {
        dryRun: dryRun.value,
      },
    });
  } catch (err) {
    errorMessage.value = getErrorMessage(err, t('anErrorOccurred'));
  }

  loading.value = false;
}

function open(id) {
  item.value = null;
  loading.value = false;
  errorMessage.value = '';

  templateId.value = id;
  isOpen.value = true;
  dryRun.value = false;
}

function close() {
  isOpen.value = false;
  emit('close');
}

defineExpose({
  open,
});
</script>
