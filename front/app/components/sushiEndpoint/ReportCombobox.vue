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

const search = ref('');

const supportedReports = computed(() => {
  const legacy = (props.endpoint?.supportedReports ?? []).map((r) => r);
  const supported = Object.entries(props.endpoint?.supportedData ?? {}).flatMap(
    ([r, data]) => (data?.supported?.value ? [r] : []),
  );

  const reports = Array.from(new Set([...legacy, ...supported]));
  return reports.map((value) => ({
    value: value.toLowerCase(),
    title: value.toUpperCase(),
  }));
});
</script>
