<template>
  <v-toolbar density="comfortable" class="bg-transparent">
    <template #prepend>
      <v-btn
        icon="mdi-menu"
        @click="toggle()"
      />
    </template>

    <template #title>
      <slot name="title">
        {{ title }}
      </slot>
    </template>

    <template #append>
      <slot />

      <template v-if="refresh">
        <v-btn
          v-if="icons"
          v-tooltip="$t('refresh')"
          :loading="loading"
          icon="mdi-reload"
          variant="tonal"
          density="comfortable"
          color="primary"
          class="mr-2"
          @click="refreshWithLoad()"
        />
        <v-btn
          v-else
          :text="$t('refresh')"
          :loading="loading"
          prepend-icon="mdi-reload"
          variant="tonal"
          color="primary"
          class="mr-2"
          @click="refreshWithLoad()"
        />
      </template>

      <SkeletonFilterButton
        v-if="$slots['filters-panel']"
        v-model="filtersValue"
        :icon="icons"
        :omit-from-count="omitFromFilterCount"
      >
        <template #panel="panel">
          <slot name="filters-panel" v-bind="panel" />
        </template>
      </SkeletonFilterButton>

      <v-text-field
        v-if="search !== false"
        v-model="searchValue"
        :placeholder="$t('search')"
        append-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        width="200"
        hide-details
        class="mr-2"
      />
    </template>
  </v-toolbar>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => undefined,
  },
  title: {
    type: String,
    default: undefined,
  },
  search: {
    type: [Boolean, String],
    default: false,
  },
  filters: {
    type: Object,
    default: () => undefined,
  },
  refresh: {
    type: Function,
    default: undefined,
  },
  omitFromFilterCount: {
    type: Array,
    default: () => undefined,
  },
  icons: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  'update:modelValue': (value) => !!value,
  'update:search': (value) => value.length >= 0,
  'update:filters': (value) => !!value,
});

const { toggle } = useDrawerStore();

const loading = ref(false);

const searchValue = computed({
  get: () => {
    if (typeof props.search === 'string') {
      return props.search;
    }
    return props.modelValue?.search ?? '';
  },
  set: (v) => {
    emit('update:search', v);
    emit('update:modelValue', { ...(props.modelValue ?? {}), search: v });
  },
});

const filtersValue = computed({
  get: () => ({
    ...(props.filters ?? props.modelValue ?? {}),
    page: undefined,
    sortBy: undefined,
    include: undefined,
  }),
  set: (v) => {
    emit('update:filters', v);
    emit('update:modelValue', {
      ...v,
      page: props.modelValue?.page,
      sortBy: props.modelValue?.sortBy,
      include: props.modelValue?.include,
    });
  },
});

async function refreshWithLoad() {
  loading.value = true;
  try {
    await props.refresh?.();
  } finally {
    loading.value = false;
  }
}
</script>
