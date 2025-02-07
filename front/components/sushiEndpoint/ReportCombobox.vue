<template>
  <v-combobox
    v-model:search="search"
    :model-value="modelValue ?? []"
    :items="endpoint?.supportedReports ?? []"
    @update:model-value="$emit('update:modelValue', $event ?? undefined)"
  >
    <template #prepend-item>
      <v-list-item :subtitle="$t('reports.supportedReportsOnPlatform')" />
    </template>

    <template #no-data>
      <v-list-item :title="$t('reports.supportedReportsUnavailable')">
        <template v-if="search" #title>
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
defineProps({
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
</script>
