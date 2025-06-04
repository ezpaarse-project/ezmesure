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
        <template #[`item.status`]="{ item }">
          <ApplyStatusChip :item="item" />
        </template>

        <template #[`item.data.institutions`]="{ item }">
          {{ item.data.institutions?.length ?? 0 }}
        </template>

        <template #no-data>
          <span v-if="idle" v-text="$t('repoAliasTemplates.applyToSeeAliases')" />
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
import ApplyStatusChip from './ApplyStatusChip.vue';

const emit = defineEmits({
  close: (applied) => typeof applied === 'boolean',
});

const { t } = useI18n();

const isOpen = ref(false);
const dryRun = ref(false);
const templateId = ref(null);

const {
  data: result,
  status,
  error,
  execute,
  clear,
} = useFetch(() => `/api/repository-alias-templates/${templateId.value}/_apply`, {
  method: 'GET',
  lazy: true,
  immediate: false,
  watch: false,
  query: {
    dryRun,
  },
});

const createdAliases = computed(() => result.value?.items ?? []);
const idle = computed(() => status.value === 'idle');
const loading = computed(() => status.value === 'pending');
const errorMessage = computed(() => error.value && (error.value?.data?.error || t('anErrorOccurred')));

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
  if (templateId.value) {
    await execute();
  }
}

function open(id) {
  clear();
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
