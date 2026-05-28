<template>
  <v-sheet
    color="black"
    class="d-flex position-relative"
    v-bind="$attrs"
  >
    <div
      class="d-flex align-center ga-2 position-absolute"
      style="top: 10px; right: 25px; z-index: 99;"
    >
      <v-chip
        v-if="loading"
        :text="$t('admin.logs.connecting')"
        variant="flat"
        color="white"
      >
        <template #prepend>
          <v-progress-circular
            indeterminate="disable-shrink"
            size="12"
            width="2"
            class="mr-2"
          />
        </template>
      </v-chip>

      <v-chip
        v-else-if="error"
        :text="$t('admin.logs.connectionError')"
        color="red"
        variant="flat"
      />

      <v-text-field
        v-model="search"
        density="compact"
        :placeholder="$t('search')"
        prepend-inner-icon="mdi-magnify"
        variant="solo"
        width="200"
        hide-details
      />
    </div>

    <v-virtual-scroll
      ref="scroller"
      :items="filteredEntries"
      class="pa-2 overflow-y-scroll"
    >
      <template #default="{ item: entry }">
        <slot name="entry" :item="entry">
          <slot v-if="entry.date" name="date" :item="entry" :value="entry.date">
            <span class="text-gray">{{ entry.date }}</span>
          </slot>

          <slot v-if="entry.level" name="value" :item="entry" :value="entry.level">
            <span :class="`text-${entry.color} mx-1`">{{ entry.level }}:</span>
          </slot>

          <slot v-if="entry.text" name="text" :item="entry" :value="entry.text">
            <span style="word-break: break-word;">{{ entry.text }}</span>
          </slot>
        </slot>
      </template>
    </v-virtual-scroll>
  </v-sheet>
</template>

<script setup>
const props = defineProps({
  source: {
    type: String,
    required: true,
  },
  init: {
    type: String,
    default: '',
  },
  itemLevel: {
    type: String,
    default: 'level',
  },
  itemText: {
    type: String,
    default: 'message',
  },
  itemDate: {
    type: String,
    default: 'timestamp',
  },
  levelColors: {
    type: Map,
    default: () => new Map([
      ['info', 'green'],
      ['verbose', 'blue'],
      ['warn', 'orange'],
      ['warning', 'orange'],
      ['error', 'red'],
    ]),
  },
});

const logs = ref([]);
const search = shallowRef('');
const initialLoading = shallowRef(false);
const scroller = useTemplateRef('scroller');

const {
  data,
  status,
  error,
  close,
  open,
} = useEventSource(props.source, [], {
  autoReconnect: { delay: 2000 },
  immediate: false,
});

async function fetchInitialData() {
  if (typeof props.init === 'string') {
    initialLoading.value = true;

    try {
      const items = await $fetch(props.init);

      if (Array.isArray(items)) {
        logs.value.push(...items);
      }
    } catch (e) {
      console.error('Failed to fetch initial log items', e);
    }

    initialLoading.value = false;

    nextTick(() => {
      scroller.value.$el.scroll(0, scroller.value.$el.scrollHeight);
    });
  }

  open();
}

onMounted(() => {
  fetchInitialData();
});

onBeforeUnmount(() => {
  close();
});

const loading = computed(() => status.value === 'CONNECTING' || initialLoading.value);

const entries = computed(
  () => logs.value
    .map((item) => {
      const level = item[props.itemLevel];
      const text = item[props.itemText];
      const date = item[props.itemDate];

      return {
        raw: item,
        date,
        level,
        text,
        color: props.levelColors.get(level) || 'white',
      };
    }),
);

const filteredEntries = computed(() => {
  if (!search.value) {
    return entries.value;
  }

  const lowerSearch = search.value.toLowerCase();

  return entries.value.filter((entry) => {
    if (entry.text?.toLowerCase().includes(lowerSearch)) { return true; }
    if (entry.level?.toLowerCase().includes(lowerSearch)) { return true; }
    return false;
  });
});

watch(data, (value) => {
  try {
    logs.value.push(JSON.parse(value));
  } catch (e) {
    console.error('Received invalid log data', e);
  }
});
</script>

<style>
.v-virtual-scroll__container {
  overflow-anchor: none;
}

/**
 * Insert a small invisible content at the end of the scroller that serves as an overflow anchor
 * That way the browser will pin the scroll bar to the bottom of the content
 */
.v-virtual-scroll {
  &::after {
    content: '';
    display: block;
    height: 1px;
    overflow-anchor: auto;
  }
}
</style>
