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
        v-for="level in levels"
        :key="level.value"
        v-tooltip="level.text"
        :readonly="readonly"
        size="small"
        variant="outlined"
      >
        <v-icon :icon="level.icon" size="x-large" />
      </v-btn>
    </template>

    <template v-else>
      <v-btn
        v-for="level in levels"
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
});

const emit = defineEmits({
  'update:modelValue': (value) => !!value || value === undefined,
});

const { t } = useI18n();

const levels = computed(() => [
  { text: t('permissions.none'), icon: 'mdi-eye-off', value: 'none' },
  { text: t('permissions.read'), icon: 'mdi-book', value: 'read' },
  { text: t('permissions.write'), icon: 'mdi-book-edit', value: 'write' },
]);

const currentLevel = computed({
  get: () => levels.value.findIndex((level) => level.value === props.modelValue),
  set: (index) => emit('update:modelValue', levels.value[index].value),
});
</script>
