<template>
  <v-timeline-item
    :dot-color="dot.color"
    :icon="dot.icon"
    size="small"
  >
    <div class="text-subtitle-2">
      {{ label }}
    </div>

    <div v-if="date" class="text-caption">
      {{ $t('tasks.steps.startedOn', { date }) }}
    </div>
    <div v-if="duration" class="text-caption">
      {{ $t('tasks.steps.terminatedIn', { duration }) }}
    </div>
    <div v-if="modelValue.data?.processedReportItems" class="text-caption">
      {{ $t('tasks.steps.processedItems', { n: modelValue.data.processedReportItems }) }}
    </div>
    <div v-if="modelValue.data?.deletedItems" class="text-caption">
      {{ $t('tasks.steps.deletedItems', { n: modelValue.data.deletedItems }) }}
    </div>
    <div v-if="(modelValue.data?.progress ?? 100) < 100" class="text-caption">
      {{ $t('tasks.steps.progress', { progress: modelValue.data.progress }) }}
    </div>

    <v-sheet
      v-if="modelValue.data?.url && user?.isAdmin"
      class="mt-4 pa-2"
      style="word-break: break-all;"
      rounded
      elevation="1"
    >
      <div class="text-subtitle-2">
        {{ $t('url') }}
      </div>

      {{ modelValue.data.url }}

      <v-btn
        v-if="clipboard"
        :text="$t('clipboard.copy')"
        prepend-icon="mdi-clipboard-text"
        variant="outlined"
        color="primary"
        size="x-small"
        @click="copy(modelValue.data.url)"
      />
    </v-sheet>
  </v-timeline-item>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const { t, te } = useI18n();
const { data: user } = useAuthState();
const { isSupported: clipboard, copy } = useClipboard();

const date = useDateFormat(computed(() => props.modelValue.startedAt), 'PPPpp');
const duration = useTimeAgo(computed(() => props.modelValue.runningTime));

const dot = computed(() => harvestStatus.get(props.modelValue.status) ?? { color: 'grey', icon: 'mdi-progress-question' });
const label = computed(() => {
  const key = `tasks.steps.labels.${props.modelValue.label}`;
  if (te(key)) {
    return t(key);
  }
  return props.modelValue.label;
});
</script>
