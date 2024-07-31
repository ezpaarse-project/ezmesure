<template>
  <v-btn-toggle
    v-model="currentLevel"
    :mandatory="mandatory"
    density="compact"
    color="primary"
    divided
  >
    <v-btn
      v-for="level in levels"
      :key="level.value"
      v-tooltip="level.text"
      size="small"
      variant="outlined"
    >
      <v-icon size="x-large">
        {{ level.icon }}
      </v-icon>
    </v-btn>
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
