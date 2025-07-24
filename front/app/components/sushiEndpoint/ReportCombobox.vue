<template>
  <v-combobox
    v-model:search="search"
    :model-value="modelValue?.toUpperCase() ?? ''"
    :items="supportedReports"
    :return-object="false"
    :hide-no-data="!search"
    @update:model-value="$emit('update:modelValue', $event?.toLowerCase() ?? undefined)"
  >
    <template #prepend-item>
      <v-list-item :subtitle="$t('reports.supportedReportsOnPlatform')" />
    </template>

    <template #no-data>
      <v-list-item :title="$t('reports.supportedReportsUnavailable')">
        <template #title>
          <i18n-t keypath="noMatchFor">
            <template #search>
              <strong>{{ search }}</strong>
            </template>

            <template #key>
              <kbd>{{ $t('enterKey') }}</kbd>
            </template>
          </i18n-t>
        </template>
      </v-list-item>
    </template>
  </v-combobox>
</template>

<script setup>
import { SUPPORTED_COUNTER_VERSIONS } from '@/lib/sushi';

const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: () => undefined,
  },
  endpoint: {
    type: Object,
    default: () => undefined,
  },
});

defineEmits({
  'update:modelValue': (v) => Array.isArray(v) || typeof v === 'string' || v === undefined,
});

const search = shallowRef('');

const supportedReports = computed(() => {
  const legacy = (props.endpoint?.supportedReports ?? []).map((r) => r);

  const versions = props.endpoint?.counterVersions ?? SUPPORTED_COUNTER_VERSIONS;
  const supported = versions.map(
    // We don't need first/last month available, so we can merge all versions
    (version) => Object.entries(props.endpoint?.supportedData?.[version] ?? {})
      .map(([r, data]) => (data?.supported?.value ? [r] : [])),
  ).flat(2);

  const reports = Array.from(new Set([...legacy, ...supported]));
  return reports.map((value) => ({
    value: value.toLowerCase(),
    title: value.toUpperCase(),
  }));
});
</script>
