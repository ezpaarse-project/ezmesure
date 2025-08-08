<template>
  <v-container fluid>
    <v-row>
      <DetailsField
        v-for="field in fields"
        :key="field.label"
        :value="field.value"
        :label="field.label"
        :cols="field.cols"
        style="word-wrap: anywhere;"
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

        <v-table v-if="!!sushiUrls.urls" density="compact">
          <tbody>
            <tr
              v-for="[version, { url, firstMonthAvailable }] in sushiUrls.urls"
              :key="version"
            >
              <td>
                <v-chip
                  :text="version"
                  :color="counterVersionsColors.get(version) || 'secondary'"
                  density="comfortable"
                  variant="flat"
                  label
                  class="mr-1"
                />
              </td>

              <td>
                <v-chip
                  v-if="firstMonthAvailable"
                  v-tooltip:top="$t('endpoints.firstMonthAvailable')"
                  :text="firstMonthAvailable"
                  prepend-icon="mdi-calendar-start"
                  color="info"
                  density="comfortable"
                  variant="flat"
                  class="mr-1"
                />
              </td>

              <td style="word-wrap: anywhere;">
                <div style="overflow-y: auto; width: 100%;">
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
              </td>
            </tr>
          </tbody>
        </v-table>
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

    return {
      urls: new Map(
        Object.entries(urls)
          // Sort from most recent to oldest (6 -> 5.2 -> 5.1 -> 5 -> ...)
          .sort((a, b) => (b > a ? 1 : -1))
          .map(([version, { url: baseURL, firstMonthAvailable }]) => {
            const url = new URL(baseURL);
            // Delete standard optional attributes
            url.searchParams.delete('attributes_to_show');
            url.searchParams.delete('include_parent_details');
            url.searchParams.delete('include_component_details');

            return [version, { url, firstMonthAvailable }];
          }),
      ),
    };
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
