<template>
  <v-container fluid>
    <v-row>
      <DetailsField
        v-for="field in fields"
        :key="field.label"
        :value="field.value"
        :label="field.label"
        :cols="field.cols"
      />

      <DetailsField
        v-if="modelValue.registryId"
        :label="$t('endpoints.registryUrl')"
        cols="12"
      >
        <a
          :href="`https://registry.countermetrics.org/platform/${modelValue.registryId}`"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ `https://registry.countermetrics.org/platform/${modelValue.registryId}` }}
        </a>

        <v-icon
          icon="mdi-open-in-new"
          size="small"
          color="secondary"
          end
        />
      </DetailsField>

      <DetailsField
        v-if="modelValue?.params?.length > 0"
        :label="$t('advancedSettings')"
        cols="12"
      >
        <v-tooltip
          v-for="param in modelValue.params"
          :key="param.name"
          position="top"
        >
          <template #activator="{ props: tooltip }">
            <v-chip label class="mr-1" v-bind="tooltip">
              {{ param.name }} = {{ param.value }}
            </v-chip>
          </template>

          {{ $t(`sushi.scope`) }}:
          <b>{{ $t(`sushi.paramScopes.${param.scope}`) }}</b>
        </v-tooltip>
      </DetailsField>

      <DetailsField
        v-if="modelValue.comment"
        :value="modelValue.comment"
        :label="$t('institutions.sushi.comment')"
        cols="12"
      />
    </v-row>
  </v-container>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const { t, locale } = useI18n();

function formatDate(date) {
  return dateFormat(date, locale.value, 'PPPpp');
}

const fields = computed(() => [
  { value: formatDate(props.modelValue.createdAt) || '-', label: t('endpoints.createdAt'), cols: 4 },
  { value: formatDate(props.modelValue.updatedAt) || '-', label: t('endpoints.updatedAt'), cols: 8 },

  { value: props.modelValue.sushiUrl || '', label: t('endpoints.url'), cols: 8 },
  { value: props.modelValue.technicalProvider || '-', label: t('endpoints.technicalProvider'), cols: 4 },

  { value: props.modelValue.requireCustomerId ? t('yes') : t('no'), label: t('endpoints.requireCustomerId'), cols: 4 },
  { value: props.modelValue.requireRequestorId ? t('yes') : t('no'), label: t('endpoints.requireRequestorId'), cols: 4 },
  { value: props.modelValue.requireApiKey ? t('yes') : t('no'), label: t('endpoints.requireApiKey'), cols: 4 },
]);
</script>
