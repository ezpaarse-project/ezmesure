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

      <SkeletonFilterButton
        v-if="$slots['filters-panel']"
        v-model="filtersValue"
        :icon-btn="filtersIconBtn"
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
  filtersIconBtn: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  'update:modelValue': (value) => true,
  'update:search': (value) => value.length >= 0,
  'update:filters': (value) => !!value,
});

const { toggle } = useDrawerStore();

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
    ...(props.modelValue ?? {}),
    page: undefined,
    sortBy: undefined,
    include: undefined,
  }),
  set: (v) => {
    emit('update:modelValue', { ...(props.modelValue ?? {}), ...v });
  },
});
</script>
