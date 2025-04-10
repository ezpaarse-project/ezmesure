<template>
  <v-table max-height="300px" style="overflow-y: auto;">
    <template v-if="rows.length > 0" #top>
      {{ $t('endpoints.supportedDataDesc') }}
    </template>

    <v-empty-state
      v-if="rows.length <= 0"
      :title="$t('endpoints.noSupportedData')"
      :text="$t('endpoints.noSupportedDataDesc')"
      icon="mdi-file-outline"
    />

    <tbody v-else>
      <tr v-for="[reportId, data] in rows" :key="reportId">
        <td width="25%">
          <v-checkbox
            :model-value="data.supported?.value ?? false"
            :label="reportId.toUpperCase()"
            base-color="error"
            color="success"
            density="compact"
            hide-details
            @update:model-value="patchSupportedData(reportId, { supported: $event })"
          >
            <template v-if="data.supported?.manual" #append>
              <v-btn
                v-tooltip:top="$t('endpoints.undoReport')"
                icon="mdi-undo"
                density="comfortable"
                size="small"
                variant="plain"
                @click="undoSupportedData(reportId, 'supported')"
              />
            </template>
          </v-checkbox>
        </td>
        <td width="25%">
          <v-slide-x-reverse-transition>
            <MonthPickerField
              v-if="data.supported?.value"
              :model-value="data.firstMonthAvailable?.value"
              :label="$t('endpoints.firstMonthAvailable')"
              :max="data.lastMonthAvailable?.value"
              variant="underlined"
              density="compact"
              prepend-icon="mdi-calendar-start"
              hide-details
              clearable
              @update:model-value="patchSupportedData(reportId, { firstMonthAvailable: $event })"
            >
              <template v-if="data.firstMonthAvailable?.manual" #append>
                <v-btn
                  v-tooltip:top="$t('endpoints.undoReport')"
                  icon="mdi-undo"
                  density="comfortable"
                  size="small"
                  variant="plain"
                  @click.stop="undoSupportedData(reportId, 'firstMonthAvailable')"
                />
              </template>
            </MonthPickerField>
          </v-slide-x-reverse-transition>
        </td>
        <td width="25%">
          <v-slide-x-reverse-transition>
            <MonthPickerField
              v-if="data.supported?.value"
              :model-value="data.lastMonthAvailable?.value"
              :label="$t('endpoints.lastMonthAvailable')"
              :min="data.firstMonthAvailable?.value"
              variant="underlined"
              density="compact"
              prepend-icon="mdi-calendar-end"
              hide-details
              clearable
              @update:model-value="patchSupportedData(reportId, { lastMonthAvailable: $event })"
            >
              <template v-if="data.lastMonthAvailable?.manual" #append>
                <v-btn
                  v-tooltip:top="$t('endpoints.undoReport')"
                  icon="mdi-undo"
                  density="comfortable"
                  size="small"
                  variant="plain"
                  @click.stop="undoSupportedData(reportId, 'lastMonthAvailable')"
                />
              </template>
            </MonthPickerField>
          </v-slide-x-reverse-transition>
        </td>
      </tr>
    </tbody>

    <template #bottom>
      <v-menu
        v-model="isAdditionalReportOpen"
        :close-on-content-click="false"
        min-width="200px"
        width="500px"
        @update:model-value="resetForm"
      >
        <template #activator="{ props: menu }">
          <v-btn
            :text="$t('endpoints.addAdditionalReport')"
            color="secondary"
            prepend-icon="mdi-plus"
            block
            class="mt-2"
            v-bind="menu"
          />
        </template>

        <v-card>
          <template #text>
            <v-row>
              <v-col>
                <v-form
                  id="additionalReportForm"
                  ref="additionalReportForm"
                  @submit.prevent="addSupportedData"
                >
                  <v-text-field
                    v-model="additionalReport"
                    :label="$t('harvest.jobs.reportType')"
                    variant="underlined"
                    hide-details="auto"
                    autofocus
                  />
                </v-form>
              </v-col>
            </v-row>
          </template>

          <template #actions>
            <v-spacer />

            <v-btn
              :text="$t('add')"
              :disabled="!additionalReport"
              color="success"
              prepend-icon="mdi-plus"
              variant="text"
              type="submit"
              form="additionalReportForm"
            />
          </template>
        </v-card>
      </v-menu>
    </template>
  </v-table>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:modelValue']);

const isAdditionalReportOpen = ref(false);
const additionalReport = ref('');
const additionalReportForm = useTemplateRef('additionalReportForm');

const { cloned: innerSupportedData } = useCloned(props.modelValue);
const { cloned: originalSupportedData } = useCloned(props.modelValue, { manual: true });

const rows = computed(() => {
  const entries = Object.entries(innerSupportedData.value);
  return entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([reportId, data]) => [reportId, data]);
});

function patchSupportedData(reportId, params) {
  const data = { ...(innerSupportedData.value[reportId] ?? {}) };
  if ('supported' in params) {
    data.supported = { value: params.supported, manual: true };
  }
  if ('firstMonthAvailable' in params) {
    data.firstMonthAvailable = { value: params.firstMonthAvailable, manual: true };
  }
  if ('lastMonthAvailable' in params) {
    data.lastMonthAvailable = { value: params.lastMonthAvailable, manual: true };
  }

  innerSupportedData.value[reportId] = data;

  emit('update:modelValue', innerSupportedData.value);
}

function addSupportedData() {
  patchSupportedData(additionalReport.value.toLowerCase(), { supported: true });
  additionalReport.value = '';
  isAdditionalReportOpen.value = false;

  emit('update:modelValue', innerSupportedData.value);
}

function resetForm() {
  additionalReportForm.value?.reset();
}

function undoSupportedData(reportId, field) {
  const original = originalSupportedData.value[reportId];
  const data = { ...(innerSupportedData.value[reportId] ?? {}) };

  if (field === 'supported' && original?.[field]?.raw == null) {
    delete innerSupportedData.value[reportId];

    emit('update:modelValue', innerSupportedData.value);
    return;
  }

  const value = original?.[field]?.raw;
  data[field] = value != null ? { raw: value, value, manual: false } : undefined;
  innerSupportedData.value[reportId] = data;

  emit('update:modelValue', innerSupportedData.value);
}
</script>
