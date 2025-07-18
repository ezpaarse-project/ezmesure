<template>
  <v-btn-toggle
    v-model="currentLevel"
    :mandatory="mandatory"
    density="compact"
    color="primary"
    divided
  >
    <template v-if="icons">
      <v-btn
        v-for="level in levelOptions"
        :key="level.value"
        v-tooltip:top="level.text"
        :readonly="readonly"
        size="small"
        variant="outlined"
      >
        <v-icon :icon="level.icon" size="x-large" />
      </v-btn>
    </template>

    <template v-else>
      <v-btn
        v-for="level in levelOptions"
        :key="level.value"
        :readonly="readonly"
        size="small"
        variant="outlined"
      >
        <v-icon :icon="level.icon" size="x-large" start />

        {{ level.text }}
      </v-btn>
    </template>
  </v-btn-toggle>
</template>

<script setup>
const LEVEL_ICONS = {
  none: 'mdi-eye-off',
  read: 'mdi-book',
  write: 'mdi-book-edit',
};

const props = defineProps({
  modelValue: {
    type: String,
    default: 'none',
  },
  mandatory: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  icons: {
    type: Boolean,
    default: false,
  },
  levels: {
    type: Array,
    default: () => ['none', 'read', 'write'],
  },
});

const emit = defineEmits({
  'update:modelValue': (value) => !!value || value === undefined,
});

const { t } = useI18n();

const levelOptions = computed(() => props.levels.map((level) => ({
  text: t(`permissions.${level}`),
  icon: LEVEL_ICONS[level],
  value: level,
})));

const currentLevel = computed({
  get: () => levelOptions.value.findIndex((level) => level.value === props.modelValue),
  set: (index) => emit('update:modelValue', levelOptions.value[index].value),
});
</script>
