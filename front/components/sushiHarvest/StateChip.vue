<template>
  <template v-if="lastHarvest">
    <v-menu
      location="start center"
      offset="5"
      open-delay="50"
      open-on-hover
    >
      <template #activator="{ props: menu }">
        <ProgressLinearStack
          :model-value="bars"
          height="8"
          v-bind="menu"
          class="mb-1"
        />
      </template>

      <v-sheet min-width="300">
        <v-table density="comfortable">
          <tbody>
            <tr>
              <th>{{ $t('harvest.jobs.period') }}</th>

              <th class="text-right">
                {{ period.start }} ~ {{ period.end }}
              </th>
            </tr>

            <template v-for="row in bars">
              <tr v-if="row.value > 0" :key="row.key">
                <td>
                  <v-icon
                    v-if="row.icon"
                    :icon="row.icon"
                    :color="row.color"
                    start
                  />

                  {{ row.label }}
                </td>

                <td class="text-right">
                  {{ row.valueStr }}
                </td>
              </tr>
            </template>
          </tbody>
        </v-table>
      </v-sheet>
    </v-menu>

    <v-chip
      :text="lastHarvestDate"
      size="small"
      color="secondary"
      variant="outlined"
      @click="$emit('click:harvest', lastHarvest)"
    />
  </template>
</template>

<script setup>
import { parseISO } from 'date-fns';

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
  endpoint: {
    type: Object,
    default: undefined,
  },
  currentYear: {
    type: Number,
    default: undefined,
  },
});

defineEmits({
  'click:harvest': (harvest) => !!harvest,
});

const { t, locale } = useI18n();

const harvests = computed(() => {
  let value = props.modelValue;

  if (Array.isArray(props.endpoint?.ignoredReports)) {
    const ignoredSet = new Set(props.endpoint.ignoredReports);
    value = value.filter((h) => !ignoredSet.has(h.reportId));
  }

  if (props.currentYear) {
    value = value.filter((h) => h.period.startsWith(props.currentYear));
  }

  return value;
});

const lastHarvest = computed(
  () => harvests.value
    .map((harvest) => ({ ...harvest, harvestDate: parseISO(harvest.harvestedAt) }))
    .sort((a, b) => b.harvestDate - a.harvestDate)
    .at(0),
);
const lastHarvestDate = useDateFormat(() => lastHarvest.value?.harvestDate);

const period = computed(() => {
  const sorted = harvests.value.toSorted((a, b) => a.period.localeCompare(b.period));
  return {
    start: sorted.at(0).period,
    end: sorted.at(-1).period,
  };
});

const bars = computed(() => {
  const getValue = (states) => {
    const statesSet = new Set(states);
    const stateCount = harvests.value.filter((h) => statesSet.has(h.status)).length;
    const value = stateCount / harvests.value.length;
    return {
      value,
      valueStr: value.toLocaleString(locale.value, { style: 'percent' }),
    };
  };

  return [
    {
      key: 'success',
      label: t('tasks.status.finished'),
      ...getValue(['finished']),
      ...harvestStatus.get('finished') ?? {},
    },
    {
      key: 'missing',
      label: t('tasks.status.missing'),
      ...getValue(['missing']),
      ...harvestStatus.get('missing') ?? {},
    },
    {
      key: 'failed',
      label: t('tasks.status.error'),
      ...getValue(['failed', 'interrupted', 'cancelled']),
      ...harvestStatus.get('failed') ?? {},
    },
    {
      key: 'pending',
      type: 'stream',
      label: t('tasks.status.waiting'),
      ...getValue(['running', 'delayed', 'waiting']),
      ...harvestStatus.get('waiting') ?? {},
    },
  ];
});
</script>
