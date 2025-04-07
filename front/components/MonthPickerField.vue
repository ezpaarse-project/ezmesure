<template>
  <div>
    <v-menu v-model="isOpen" :close-on-content-click="false">
      <template #activator="{ props: menu }">
        <v-text-field
          :model-value="modelValue"
          :label="label"
          :prepend-icon="prependIcon"
          :density="density"
          :variant="variant"
          :hide-details="hideDetails"
          :clearable="clearable"
          readonly
          v-bind="menu"
          @click:clear="clear"
        >
          <template v-if="$slots.append" #append>
            <slot name="append" />
          </template>
        </v-text-field>
      </template>

      <v-card :title="label" :prepend-icon="prependIcon" width="500">
        <template #text>
          <v-row>
            <v-col class="d-flex justify-center align-center">
              <v-btn
                icon="mdi-chevron-left"
                variant="text"
                color="primary"
                density="comfortable"
                :disabled="viewYear <= (minYearMonth?.year ?? Number.NEGATIVE_INFINITY)"
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
                :disabled="viewYear >= (maxYearMonth?.year ?? Number.POSITIVE_INFINITY)"
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
  label: {
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
    type: [String, Boolean],
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

const { locale } = useI18n();

const isOpen = ref(false);
const viewYear = ref(0);

const minYearMonth = computed(() => {
  if (!props.min) {
    return undefined;
  }

  const [year, month] = props.min.split('-');
  return {
    year: Number.parseInt(year, 10),
    month: Number.parseInt(month, 10),
  };
});

const maxYearMonth = computed(() => {
  if (!props.max) {
    return undefined;
  }

  const [year, month] = props.max.split('-');
  return {
    year: Number.parseInt(year, 10),
    month: Number.parseInt(month, 10),
  };
});

const yearMonth = computed({
  get() {
    if (!props.modelValue) {
      const now = new Date();
      return {
        year: `${now.getFullYear()}`,
        month: `${now.getMonth()}`,
      };
    }

    const [year, month] = props.modelValue.split('-');
    return { year, month };
  },
  set({ year, month }) {
    emit('update:modelValue', `${year}-${month}`);
  },
});

const year = computed(() => Number.parseInt(yearMonth.value.year, 10));

const month = computed(() => Number.parseInt(yearMonth.value.month, 10));

const availableMonths = computed(() => Array.from({ length: monthsInYear }, (_, i) => {
  const value = i + 1;

  const isBeforeMin = minYearMonth.value
    && minYearMonth.value.year === viewYear.value
    && minYearMonth.value.month > value;

  const isAfterMax = maxYearMonth.value
    && maxYearMonth.value.year === viewYear.value
    && maxYearMonth.value.month < value;

  return {
    value,
    text: dateFormat(new Date(year.value, i, 1), locale.value, 'MMMM'),
    current: props.modelValue && year.value === viewYear.value && value === month.value,
    disabled: isBeforeMin || isAfterMax,
  };
}));

const availableYearsLimits = computed(() => ({
  start: viewYear.value - 2,
  end: viewYear.value + 3,
}));

const availableYears = computed(() => Array.from(
  { length: availableYearsLimits.value.end - availableYearsLimits.value.start },
  (_, i) => {
    const value = availableYearsLimits.value.start + i;
    const isBeforeMin = minYearMonth.value && minYearMonth.value.year > value;
    const isAfterMax = maxYearMonth.value && maxYearMonth.value.year < value;
    return {
      value,
      selected: viewYear.value === value,
      current: props.modelValue && year.value === value,
      disabled: isBeforeMin || isAfterMax,
    };
  },
));

function setValue(value) {
  yearMonth.value = {
    year: `${viewYear.value}`.padStart(4, '0'),
    month: `${value}`.padStart(2, '0'),
  };
}

function clear() {
  isOpen.value = false;
  emit('update:modelValue', undefined);
}

watch(year, (value) => { viewYear.value = value; }, { immediate: true });
</script>
