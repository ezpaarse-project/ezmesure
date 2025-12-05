<template>
  <v-table
    density="compact"
    height="100%"
    fixed-header
    class="h-100"
  >
    <template #top>
      <v-toolbar v-if="period">
        <div class="d-flex align-center ml-2">
          <v-btn
            :disabled="loading || isPreviousDisabled"
            color="primary"
            variant="text"
            density="comfortable"
            icon="mdi-arrow-left"
            @click="changePeriod(-1)"
          />

          <MonthPickerField
            :model-value="period.beginDate"
            :label="$t('harvest.jobs.beginDate')"
            :min="min"
            :max="period.endDate"
            :disabled="loading"
            variant="underlined"
            density="compact"
            prepend-icon="mdi-calendar-start"
            hide-details
            style="width: 150px;"
            @update:model-value="$emit('update:period', { ...period, beginDate: $event })"
          />

          <div class="mx-4">
            ~
          </div>

          <MonthPickerField
            :model-value="period.endDate"
            :label="$t('harvest.jobs.endDate')"
            :min="period.beginDate"
            :max="max"
            :disabled="loading"
            variant="underlined"
            density="compact"
            prepend-icon="mdi-calendar-end"
            hide-details
            style="width: 150px;"
            @update:model-value="$emit('update:period', { ...period, endDate: $event })"
          />

          <v-btn
            :disabled="loading || isNextDisabled"
            color="primary"
            variant="text"
            density="comfortable"
            icon="mdi-arrow-right"
            @click="changePeriod(1)"
          />
        </div>

        <template #append>
          <v-btn
            :text="$t('sushi.globalHarvestState.periodShortcut', 1)"
            :disabled="loading"
            :active="periodDiff === 1"
            active-color="accent"
            density="comfortable"
            size="small"
            class="mx-1"
            @click="switchToMonth()"
          />
          <v-btn
            :text="$t('sushi.globalHarvestState.periodShortcut', monthsInQuarter)"
            :disabled="loading"
            :active="periodDiff === monthsInQuarter"
            active-color="accent"
            density="comfortable"
            size="small"
            class="mx-1"
            @click="switchToQuarter()"
          />
          <v-btn
            :text="$t('sushi.globalHarvestState.periodShortcut', monthsInSemester)"
            :disabled="loading"
            :active="periodDiff === monthsInSemester"
            active-color="accent"
            density="comfortable"
            size="small"
            class="mx-1"
            @click="switchToSemester()"
          />
          <v-btn
            :text="$t('sushi.globalHarvestState.periodShortcut', monthsInYear)"
            :disabled="loading"
            :active="periodDiff === monthsInYear"
            active-color="accent"
            density="comfortable"
            size="small"
            class="mx-1"
            @click="switchToYear()"
          />
        </template>
      </v-toolbar>

      <v-container v-if="$slots.top" fluid>
        <slot name="top" />
      </v-container>
    </template>

    <div v-if="loading" class="d-flex align-center justify-center mt-8">
      <v-empty-state
        :title="$t('pleaseWait')"
        :text="$t('sushi.globalHarvestState.loading')"
      >
        <template #media>
          <v-progress-circular
            color="primary"
            size="128"
            indeterminate
            class="mb-4"
          >
            <v-icon icon="mdi-table-sync" />
          </v-progress-circular>
        </template>
      </v-empty-state>
    </div>

    <template v-else-if="(modelValue?.rows.length ?? 0) > 0">
      <thead>
        <tr>
          <th />
          <th v-for="[, header] in columnHeaders" :key="header.id" class="matrix--column-header text-center">
            <slot name="column-header" v-bind="header">
              {{ header.value }}
            </slot>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <th class="matrix--row-header">
            <slot name="row-header" v-bind="row.header">
              {{ row.header.value }}
            </slot>
          </th>
          <td v-for="cell in row.cells" :key="cell.id" class="text-center">
            <div class="d-flex align-center justify-center">
              <SushiHarvestGlobalMatrixCell :model-value="cell" />
            </div>
          </td>
        </tr>
      </tbody>
    </template>

    <div v-else class="d-flex align-center justify-center">
      <v-empty-state
        icon="mdi-table-headers-eye-off"
        :title="$t('sushi.noMatrix.title')"
        :text="$t('sushi.noMatrix.description')"
      />
    </div>
  </v-table>
</template>

<script setup>
import { monthsInQuarter, monthsInYear } from 'date-fns/constants';
import {
  addMonths,
  differenceInMonths,
  getQuarter,
  format,
  parse,
} from 'date-fns';

// Avoid using magical numbers for semester calculation
const quartersInSemester = 2;
const monthsInSemester = monthsInQuarter * quartersInSemester;

const DATE_MONTH_FORMAT = 'yyyy-MM';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => undefined,
  },
  period: {
    type: Object,
    default: () => undefined,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  columnKey: {
    type: String,
    default: 'id',
  },
  columnValue: {
    type: String,
    default: 'name',
  },
  rowKey: {
    type: String,
    default: 'id',
  },
  rowValue: {
    type: String,
    default: 'name',
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
  'update:period': (value) => typeof value.beginDate === 'string' && typeof value.endDate === 'string',
});

const columnHeaders = computed(() => new Map(
  (props.modelValue?.headers.columns ?? []).map((col) => {
    const id = props.columnKey ? col[props.columnKey] : col;
    return [id, {
      id,
      value: props.columnValue ? col[props.columnValue] : col,
      item: col,
    }];
  }),
));

const rowHeaders = computed(() => new Map(
  (props.modelValue?.headers.rows ?? []).map((row) => {
    const id = props.rowKey ? row[props.rowKey] : row;
    return [id, {
      id,
      value: props.rowValue ? row[props.rowValue] : row,
      item: row,
    }];
  }),
));

const rows = computed(() => props.modelValue.rows.map(
  (row) => ({
    ...row,
    header: rowHeaders.value.get(row.id) ?? { id: row.id, value: '???' },
  }),
));

const periodDate = computed(() => {
  if (!props.period) {
    return undefined;
  }

  const now = new Date();

  return {
    beginDate: parse(props.period.beginDate, DATE_MONTH_FORMAT, now),
    endDate: parse(props.period.endDate, DATE_MONTH_FORMAT, now),
  };
});

const periodDiff = computed(() => {
  if (!periodDate.value) {
    return undefined;
  }

  return differenceInMonths(periodDate.value.endDate, periodDate.value.beginDate) + 1;
});

function getNewPeriod(multiplier = 0) {
  if (!periodDate.value) {
    return undefined;
  }

  const { beginDate, endDate } = periodDate.value;

  return {
    beginDate: format(addMonths(beginDate, periodDiff.value * multiplier), DATE_MONTH_FORMAT),
    endDate: format(addMonths(endDate, periodDiff.value * multiplier), DATE_MONTH_FORMAT),
  };
}

const isPreviousDisabled = computed(() => {
  if (!periodDate.value || !props.min) {
    return false;
  }

  const newPeriod = getNewPeriod(-1);

  return newPeriod.beginDate <= props.min;
});

const isNextDisabled = computed(() => {
  if (!periodDate.value || !props.max) {
    return false;
  }
  const newPeriod = getNewPeriod(1);

  return newPeriod.endDate >= props.max;
});

function changePeriod(multiplier = 0) {
  emit('update:period', getNewPeriod(multiplier));
}

function switchToMonth() {
  if (!props.period) {
    return;
  }

  emit('update:period', {
    beginDate: props.period.beginDate,
    endDate: props.period.beginDate,
  });
}

function switchToQuarter() {
  if (!periodDate.value) {
    return;
  }

  // 0-indexed quarter
  const quarter = getQuarter(periodDate.value.beginDate) - 1;

  const beginDate = new Date(periodDate.value.beginDate);
  beginDate.setMonth(quarter * monthsInQuarter);

  emit('update:period', {
    beginDate: format(beginDate, DATE_MONTH_FORMAT),
    endDate: format(addMonths(beginDate, monthsInQuarter - 1), DATE_MONTH_FORMAT),
  });
}

function switchToSemester() {
  if (!periodDate.value) {
    return;
  }

  // 0-indexed semester
  const semester = Math.floor((getQuarter(periodDate.value.beginDate) - 1) / quartersInSemester);

  const beginDate = new Date(periodDate.value.beginDate);
  beginDate.setMonth(semester * monthsInSemester);

  emit('update:period', {
    beginDate: format(beginDate, DATE_MONTH_FORMAT),
    endDate: format(addMonths(beginDate, monthsInSemester - 1), DATE_MONTH_FORMAT),
  });
}

function switchToYear() {
  if (!periodDate.value) {
    return;
  }

  const year = periodDate.value.beginDate.getFullYear();

  emit('update:period', {
    beginDate: `${year}-01`,
    endDate: `${year}-12`,
  });
}
</script>
