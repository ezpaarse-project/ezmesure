<template>
  <div>
    <v-toolbar
      :title="$t('spaces.filters.title')"
      style="background-color: transparent;"
    >
      <template #prepend>
        <v-icon icon="mdi-tab-search" end />
      </template>

      <template #append>
        <v-btn
          v-tooltip="$t('reset')"
          icon="mdi-filter-off"
          @click="clearFilters"
        />

        <v-btn
          icon="mdi-close"
          @click="$emit('update:show', false)"
        />
      </template>
    </v-toolbar>

    <v-container>
      <v-row>
        <v-col cols="12">
          <FiltersSelect
            v-model="filters.type"
            :items="typeItems"
            :label="$t('type')"
            prepend-icon="mdi-tag"
            clearable
          />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits({
  'update:modelValue': (v) => !!v,
  'update:show': (v) => typeof v === 'boolean',
});

const { t } = useI18n();

const {
  filters,
  resetFilters,
} = useFilters(() => props.modelValue, emit);

const typeItems = computed(() => {
  const types = Array.from(repoColors.keys());
  return types.map((type) => ({
    value: type,
    title: t(`spaces.types.${type}`),
  }));
});

function clearFilters() {
  resetFilters();
  emit('update:show', false);
}
</script>
