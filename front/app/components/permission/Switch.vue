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
        :disabled="level.disabled"
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
        :disabled="level.disabled"
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
import { permissionLevelEnum } from '@/lib/permissions/utils';

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
  max: {
    type: String,
    default: undefined,
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

const maxValue = computed(() => (props.max ? permissionLevelEnum[props.max] : undefined));

const levelOptions = computed(() => props.levels.map((level) => ({
  text: t(`permissions.${level}`),
  icon: permLevelColors.get(level)?.icon,
  value: level,
  disabled: props.max ? permissionLevelEnum[level] > maxValue.value : false,
})));

const currentLevel = computed({
  get: () => levelOptions.value.findIndex((level) => level.value === props.modelValue),
  set: (index) => emit('update:modelValue', levelOptions.value[index].value),
});
</script>
