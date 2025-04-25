<template>
  <div>
    <v-menu v-model="isOpen" :close-on-content-click="false">
      <template #activator="{ props: menu }">
        <v-text-field
          :model-value="modelValueInput"
          :label="label"
          :placeholder="placeholder"
          :prepend-icon="prependIcon"
          :density="density"
          :variant="variant"
          :hide-details="hideDetails"
          :clearable="clearable"
          :rules="[
            (v) => !v || checkInputValid(v).error || true,
          ]"
          v-bind="menu"
          @update:model-value="updateModelValueOnType($event)"
          @click:clear="clear"
        >
          <template v-if="$slots.append" #append>
            <slot name="append" />
          </template>
        </v-text-field>
      </template>

      <v-card :title="title || label" :prepend-icon="prependIcon" width="500">
        <template #text>
          <v-row>
            <v-col class="d-flex justify-center align-center">
              <v-btn
                icon="mdi-chevron-left"
                variant="text"
                color="primary"
                density="comfortable"
                :disabled="viewYear <= minYearMonth.year"
                @click="viewYear -= 1"
              />

              <v-btn
                v-for="item in availableYears"
                :key="item.value"
                :variant="item.selected ? 'outlined' : 'text'"
                :color="item.current ? 'primary' : undefined"
                :disabled="item.disabled"
                density="comfortable"
                class="text-h6"
                @click="viewYear = item.value"
              >
                {{ item.value }}
              </v-btn>

              <v-btn
                icon="mdi-chevron-right"
                variant="text"
                color="primary"
                density="comfortable"
                :disabled="viewYear >= maxYearMonth.year"
                @click="viewYear += 1"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col
              v-for="item in availableMonths"
              :key="item.value"
              cols="4"
            >
              <v-btn
                :text="item.text"
                :color="item.current ? 'primary' : undefined"
                :disabled="item.disabled"
                variant="text"
                density="comfortable"
                block
                @click="setValue(item.value)"
              />
            </v-col>
          </v-row>
        </template>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
import { monthsInYear } from 'date-fns/constants';

const props = defineProps({
  modelValue: {
    type: String,
    default: undefined,
  },
  separator: {
    type: String,
    default: '-',
  },
  label: {
    type: String,
    default: undefined,
  },
  title: {
    type: String,
    default: undefined,
  },
  placeholder: {
    type: String,
    default: undefined,
  },
  prependIcon: {
    type: String,
    default: undefined,
  },
  variant: {
    type: String,
    default: undefined,
  },
  density: {
    type: String,
    default: undefined,
  },
  hideDetails: {
    type: Boolean,
    default: undefined,
  },
  clearable: {
    type: Boolean,
    default: false,
  },
  min: {
    type: String,
    default: undefined,
  },
  max: {
    type: String,
    default: undefined,
  },
});

const emit = defineEmits({
  'update:modelValue': (item) => item !== null,
});

const DATE_FORMAT_REGEX = new RegExp(`^(?<year>\\d{4})${props.separator}(?<month>\\d{2})(${props.separator}(?<day>\\d{2}))?$`);

const { t, locale } = useI18n();

const isOpen = ref(false);
const viewYear = ref(0);
const modelValueInput = ref('');

const formatYear = (y) => `${y}`.toString().padStart(4, '0');
const formatMonth = (m) => `${m}`.toString().padStart(2, '0');

const minYearMonth = computed(() => {
  if (!props.min) {
    return {
      year: 0,
      month: 1,
    };
  }

  const [year, month] = props.min.split(props.separator);
  return {
    year: Number.parseInt(year, 10),
    month: Number.parseInt(month, 10),
  };
});

const formattedMinYearMonth = computed(() => `${formatYear(minYearMonth.value.year)}${props.separator}${formatMonth(minYearMonth.value.month)}`);

const maxYearMonth = computed(() => {
  if (!props.max) {
    return {
      year: Number.POSITIVE_INFINITY,
      month: monthsInYear,
    };
  }

  const [year, month] = props.max.split(props.separator);
  return {
    year: Number.parseInt(year, 10),
    month: Number.parseInt(month, 10),
  };
});

const formattedMaxYearMonth = computed(() => `${formatYear(maxYearMonth.value.year)}${props.separator}${formatMonth(maxYearMonth.value.month)}`);

const yearMonth = computed({
  get() {
    if (!props.modelValue) {
      const now = new Date();
      return {
        year: `${now.getFullYear()}`,
        month: `${now.getMonth()}`,
      };
    }

    const [year, month] = props.modelValue.split(props.separator);
    return { year, month };
  },
  set({ year, month }) {
    emit('update:modelValue', `${year}${props.separator}${month}`);
  },
});

const year = computed(() => Number.parseInt(yearMonth.value.year, 10));

const month = computed(() => Number.parseInt(yearMonth.value.month, 10));

const availableMonths = computed(() => Array.from({ length: monthsInYear }, (_, i) => {
  const value = i + 1;

  const isYearInvalid = minYearMonth.value.year > viewYear.value
    || maxYearMonth.value.year < viewYear.value;

  const isBeforeMin = minYearMonth.value.year === viewYear.value
    && minYearMonth.value.month > value;

  const isAfterMax = maxYearMonth.value.year === viewYear.value
    && maxYearMonth.value.month < value;

  return {
    value,
    text: dateFormat(new Date(year.value, i, 1), locale.value, 'MMMM'),
    current: props.modelValue && year.value === viewYear.value && value === month.value,
    disabled: isYearInvalid || isBeforeMin || isAfterMax,
  };
}));

const availableYearsLimits = computed(() => ({
  start: Math.max(viewYear.value - 2, 0),
  end: viewYear.value + 3,
}));

const availableYears = computed(() => Array.from(
  { length: availableYearsLimits.value.end - availableYearsLimits.value.start },
  (_, i) => {
    const value = availableYearsLimits.value.start + i;
    const isBeforeMin = minYearMonth.value.year > value;
    const isAfterMax = maxYearMonth.value.year < value;
    return {
      value,
      selected: viewYear.value === value,
      current: props.modelValue && year.value === value,
      disabled: isBeforeMin || isAfterMax,
    };
  },
));

function checkInputValid(input) {
  // Check if input is valid
  const matches = DATE_FORMAT_REGEX.exec(input);
  if (!matches?.groups?.year || !matches?.groups?.month) {
    return { error: t('invalidFormat') };
  }

  // Regex ensured that year and month are valid numbers
  const yearInt = Number.parseInt(matches.groups.year, 10);
  const monthInt = Number.parseInt(matches.groups.month, 10);
  const value = { year: yearInt, month: monthInt };

  // Check if year and month are in range
  const { year: minYear, month: minMonth } = minYearMonth.value;
  if (yearInt < minYear || (yearInt === minYear && monthInt < minMonth)) {
    return { value, error: t('minValueError', { min: formattedMinYearMonth.value }) };
  }

  const { year: maxYear, month: maxMonth } = maxYearMonth.value;
  if (yearInt > maxYear || (yearInt === maxYear && monthInt > maxMonth)) {
    return { value, error: t('maxValueError', { max: formattedMaxYearMonth.value }) };
  }

  return { value };
}

function updateModelValueOnType(input) {
  const { value, error } = checkInputValid(input);
  if (!value) {
    return;
  }

  // Update text field only if valid
  modelValueInput.value = input;

  if (error) {
    return;
  }

  yearMonth.value = {
    year: formatYear(value.year),
    month: formatMonth(value.month),
  };
}

function setValue(value) {
  yearMonth.value = {
    year: formatYear(viewYear.value),
    month: formatMonth(value),
  };
}

function clear() {
  isOpen.value = false;
  modelValueInput.value = '';
  emit('update:modelValue', undefined);
}

watch(year, (value) => { viewYear.value = value; }, { immediate: true });
watch(() => props.modelValue, (value) => { modelValueInput.value = value; }, { immediate: true });
</script>
