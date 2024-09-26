<template>
  <div>
    <v-badge
      :model-value="filtersCount > 0"
      :content="filtersCount"
      color="primary"
      offset-x="10"
    >
      <v-btn
        v-if="icon"
        v-tooltip="$t('filter')"
        icon="mdi-filter"
        variant="tonal"
        density="comfortable"
        color="primary"
        class="mr-2"
        @click="isPanelOpen = true"
      />
      <v-btn
        v-else
        :text="$t('filter')"
        prepend-icon="mdi-filter"
        variant="tonal"
        color="primary"
        class="mr-2"
        @click="isPanelOpen = true"
      />
    </v-badge>

    <teleport v-if="ready" to="main">
      <v-navigation-drawer
        v-model="isPanelOpen"
        location="right"
        width="500"
        temporary
      >
        <slot
          name="panel"
          :model-value="modelValue"
          @update:modelValue="$emit('update:modelValue', $event)"
          @update:show="isPanelOpen = $event"
        />
      </v-navigation-drawer>
    </teleport>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  omitFromCount: {
    type: Array,
    default: () => ['search'],
  },
  icon: {
    type: Boolean,
    default: false,
  },
});

defineEmits({
  'update:modelValue': (v) => !!v,
});

const ready = ref(false);
const isPanelOpen = ref(false);

const filtersCount = computed(
  () => {
    const omitFromCount = new Set(props.omitFromCount);
    return Object.entries(props.modelValue)
      .filter(([k, v]) => v != null && !omitFromCount.has(k))
      .length;
  },
);

onMounted(() => {
  ready.value = true;
});
</script>
