<template>
  <div>
    <v-toolbar
      :title="$t('harvest.jobs.filtersTitle')"
      style="background-color: transparent;"
    >
      <template #prepend>
        <v-icon icon="mdi-magnify" end />
      </template>

      <template #append>
        <v-btn
          v-tooltip="$t('reset')"
          icon="mdi-filter-off"
          @click="clearFilters"
        />

        <v-btn
          icon="mdi-close"
          @click="$emit('update:show', false)"
        />
      </template>
    </v-toolbar>

    <v-container>
      <v-row>
        <v-col cols="12">
          <ApiFiltersSelect
            v-model="filters.endpointId"
            :items="endpointsOptions"
            :loading="credentialStatus === 'pending' && 'primary'"
            :label="$t('endpoints.vendor')"
            prepend-icon="mdi-api"
            chips
            closable-chips
            multiple
          />
        </v-col>

        <v-col cols="12">
          <ApiFiltersSelect
            v-model="filters.institutionId"
            :items="institutionsOptions"
            :loading="credentialStatus === 'pending' && 'primary'"
            :label="$t('institutions.title')"
            prepend-icon="mdi-domain"
            chips
            closable-chips
            multiple
          />
        </v-col>

        <v-col cols="6">
          <ApiFiltersSelect
            v-model="filters.reportType"
            :items="reportOptions"
            :label="$t('harvest.jobs.reportType')"
            prepend-icon="mdi-format-list-bulleted-type"
            chips
            closable-chips
            multiple
          />
        </v-col>

        <v-col cols="6">
          <ApiFiltersSelect
            v-model="filters.status"
            :items="statusOptions"
            :label="$t('status')"
            prepend-icon="mdi-list-status"
            chips
            closable-chips
            multiple
          />
        </v-col>

        <v-col cols="12">
          <ApiFiltersSelect
            v-model="filters.errorCode"
            :empty-symbol="emptySymbol"
            :items="errorOptions"
            :label="$t('harvest.jobs.errorCode')"
            prepend-icon="mdi-alert-circle"
            chips
            closable-chips
            multiple
          />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  sessionId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits({
  'update:modelValue': (v) => !!v,
  'update:show': (v) => typeof v === 'boolean',
});

const { t } = useI18n();

const {
  emptySymbol,
  filters,
  resetFilters,
} = useFilters(() => props.modelValue, emit);

const {
  status: credentialStatus,
  data: credentials,
} = await useFetch(`/api/harvests-sessions/${props.sessionId}/credentials`, {
  params: {
    include: ['endpoint', 'institution'],
  },
  lazy: true,
});

const statusOptions = computed(() => [...harvestStatus.keys()].map((key) => ({
  value: key,
  title: t(`tasks.status.${key}`),
})));

const institutionsOptions = computed(() => {
  if (!credentials.value) { return []; }

  const map = new Map(
    credentials.value
      .map((credential) => [credential.institutionId, credential.institution]),
  );
  return [...map.values()].map((i) => ({
    value: i.id,
    title: i.name,
  })).sort((a, b) => a.title.localeCompare(b.title));
});

const endpointsOptions = computed(() => {
  if (!credentials.value) { return []; }

  const map = new Map(
    credentials.value
      .map((credential) => [credential.endpointId, credential.endpoint]),
  );
  return [...map.values()].map((e) => ({
    value: e.id,
    title: e.vendor,
  })).sort((a, b) => a.title.localeCompare(b.title));
});

const reportOptions = computed(() => [
  'dr',
  'dr_d1',
  'ir',
  'pr',
  'pr_p1',
  'tr',
  'tr_b1',
  'tr_j1',
].map((key) => ({
  value: key,
  title: key.toUpperCase(),
})));

const errorOptions = computed(() => [
  'network_error',
  'unreadable_report',
  'invalid_json',
  'max_defferals_exceeded',
  'unauthorized',
  'invalid_report',
  'sushi:1000',
  'sushi:1010',
  'sushi:1020',
  'sushi:1030',
  'sushi:2000',
  'sushi:2010',
  'sushi:2020',
  'sushi:2030',
  'sushi:3000',
  'sushi:3010',
  'sushi:3020',
  'sushi:3030',
].map((key) => ({
  value: key,
  title: t(`tasks.status.exceptions.${key}`),
})));

function clearFilters() {
  resetFilters({ });
  emit('update:show', false);
}
</script>
