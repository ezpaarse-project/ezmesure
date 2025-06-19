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
        :label="$t('institutions.sushi.sushiUrl')"
        cols="12"
      >
        <v-progress-circular v-if="sushiUrls.loading === true" size="16" width="2" indeterminate />

        <v-alert
          v-if="!!sushiUrls.error"
          :title="$t('errors.generic')"
          :text="sushiUrls.error"
          density="comfortable"
          type="error"
        />

        <template v-if="!!sushiUrls.urls">
          <div
            v-for="[version, url] in sushiUrls.urls"
            :key="version"
            class="d-flex  mb-1"
          >
            <v-chip
              :text="version"
              :color="counterVersionsColors.get(version) || 'secondary'"
              size="small"
              density="comfortable"
              variant="flat"
              label
              class="mr-1"
            />

            <a
              :href="url"
              target="_blank"
              rel="noreferrer noopener"
            >
              {{ url }}<v-icon
                icon="mdi-open-in-new"
                color="secondary"
                size="small"
                class="ml-1"
              />
            </a>
          </div>
        </template>
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
import { getErrorMessage } from '@/lib/errors';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const { t, locale } = useI18n();

const sushiUrls = computedAsync(async () => {
  try {
    const urls = await $fetch(`/api/sushi/${props.modelValue.id}/_sushiUrls`);

    return { urls: new Map(Object.entries(urls)) };
  } catch (err) {
    return { error: getErrorMessage(err) };
  }
}, { loading: true });

function formatDate(date) {
  return dateFormat(date, locale.value, 'PPPpp');
}

const fields = computed(() => [
  {
    value: formatDate(props.modelValue.createdAt) || '-',
    label: t('institutions.sushi.createdAt'),
    cols: props.modelValue.archived ? 3 : 4,
  },
  {
    value: formatDate(props.modelValue.updatedAt) || '-',
    label: t('institutions.sushi.updatedAt'),
    cols: props.modelValue.archived ? 3 : 4,
  },
  {
    value: formatDate(props.modelValue.connection?.date) || '-',
    label: t('institutions.sushi.testedAt'),
    cols: props.modelValue.archived ? 3 : 4,
  },
  {
    value: props.modelValue.archived ? formatDate(props.modelValue.archivedUpdatedAt) : undefined,
    label: t('institutions.sushi.archivedAt'),
    cols: 3,
  },

  { value: props.modelValue.customerId, label: t('institutions.sushi.customerId'), cols: 4 },
  { value: props.modelValue.requestorId, label: t('institutions.sushi.requestorId'), cols: 4 },
  { value: props.modelValue.apiKey, label: t('institutions.sushi.apiKey'), cols: 4 },
].filter((f) => f.value));
</script>
