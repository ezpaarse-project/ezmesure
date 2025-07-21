/** eslint-disable quote-props */
<template>
  <v-table style="max-height: 625px; overflow-y: auto;">
    <template v-if="rows.length > 0" #top>
      <p class="pb-4">
        {{ $t('endpoints.supportedVersionsDesc') }}
      </p>
    </template>

    <tbody>
      <tr>
        <th width="25%">
          {{ $t('version') }}
        </th>
        <th width="50%" class="text-center">
          <div>{{ $t('endpoints.firstMonthAvailable') }}</div>
        </th>
      </tr>

      <tr v-for="[version, firstMonthAvailable] in rows" :key="version">
        <td width="25%">
          <v-checkbox
            :model-value="versionSet.has(version)"
            color="success"
            density="compact"
            hide-details
            @update:model-value="toggleVersion(version, $event)"
          >
            <template #label>
              <v-chip
                :text="version"
                :color="counterVersionsColors.get(version) || 'secondary'"
                density="comfortable"
                variant="flat"
                size="small"
                label
              />
            </template>
          </v-checkbox>
        </td>
        <td width="50%">
          <MonthPickerField
            v-if="version in SUPPORTED_COUNTER_VERSIONS"
            :model-value="firstMonthAvailable"
            :title="$t('endpoints.firstMonthAvailable')"
            :placeholder="$t('endpoints.undefinedAvailable')"
            variant="underlined"
            density="compact"
            prepend-icon="mdi-calendar-start"
            hide-details
            clearable
            @update:model-value="patchSupportedVersion(version, $event)"
          />
        </td>
      </tr>
    </tbody>

    <template #bottom>
      <v-menu
        v-model="isAdditionalVersionOpen"
        :close-on-content-click="false"
        min-width="200px"
        width="500px"
        @update:model-value="resetForm()"
      >
        <template #activator="{ props: menu }">
          <v-btn
            :text="$t('endpoints.addCustomVersion')"
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
                  id="additionalVersionForm"
                  ref="additionalVersionForm"
                  @submit.prevent="addVersion()"
                >
                  <p>
                    {{ $t('endpoints.customVersionDesc') }}
                  </p>

                  <v-text-field
                    v-model="customVersion"
                    :label="$t('endpoints.customVersion')"
                    :rules="versionRules"
                    prepend-icon="mdi-numeric"
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
              :disabled="!customVersion"
              color="success"
              prepend-icon="mdi-plus"
              variant="text"
              type="submit"
              form="additionalVersionForm"
            />
          </template>
        </v-card>
      </v-menu>
    </template>
  </v-table>
</template>

<script setup>
import { SUPPORTED_COUNTER_VERSIONS } from '@/lib/sushi';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  versions: {
    type: Array,
    default: () => (['5']),
  },
});

const emit = defineEmits(['update:modelValue', 'update:versions']);

const { t } = useI18n();

const customVersion = ref('');
const isAdditionalVersionOpen = ref(false);
const additionalVersionForm = useTemplateRef('additionalVersionForm');

const rows = computed(() => {
  const entries = Object.entries({
    // Shows supported by default
    ...SUPPORTED_COUNTER_VERSIONS,
    // Shows additional versions (unsupported but support might be added lated)
    ...Object.fromEntries(
      props.versions
        .filter((v) => !(v in SUPPORTED_COUNTER_VERSIONS))
        .map((v) => [v, undefined]),
    ),
    // Fill with current data
    ...props.modelValue,
  });

  // Sort from most oldest to recent (5 -> 5.1 -> 5.2 -> 6 -> ...)
  return entries.sort(([a], [b]) => (a > b ? 1 : -1));
});

const versionSet = computed(() => new Set(props.versions));

const versionRules = computed(() => [
  (v) => {
    const pattern = /^[0-9]+(\.[0-9]+(\.[0-9]+(\.[0-9]+)?)?)?$/;

    if (!v || pattern.test(v)) {
      return true;
    }
    return t('fieldMustMatch', { pattern: pattern.toString() });
  },
]);

function toggleVersion(version, value) {
  if (value) {
    emit('update:versions', [...props.versions, version]);
    return;
  }

  emit('update:versions', props.versions.filter((v) => v !== version));
}

function resetForm() {
  additionalVersionForm.value?.reset();
}

function addVersion() {
  toggleVersion(customVersion.value, true);
  customVersion.value = '';
  isAdditionalVersionOpen.value = false;
}

function patchSupportedVersion(version, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [version]: value,
  });
}
</script>
