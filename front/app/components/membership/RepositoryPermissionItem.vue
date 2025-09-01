<template>
  <v-list-item :title="repository.pattern" lines="two">
    <template #append>
      <v-slide-x-reverse-transition>
        <v-icon v-if="success" icon="mdi-check" color="success" start />
      </v-slide-x-reverse-transition>

      <PermissionSwitch
        v-model="value"
        :readonly="readonly"
        :max="max"
        mandatory
      />
    </template>

    <template #subtitle>
      <RepositoryTypeChip :model-value="repository" />
    </template>
  </v-list-item>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  repository: {
    type: Object,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  max: {
    type: String,
    default: undefined,
  },
});

const emit = defineEmits({
  'update:modelValue': (v) => v,
});

const success = shallowRef(false);

const value = computed({
  get: () => props.modelValue.get(props.repository.pattern) || 'none',
  set: (v) => {
    if (v === 'none') {
      props.modelValue.delete(props.repository.pattern);
    } else {
      props.modelValue.set(props.repository.pattern, v);
    }
    emit('update:modelValue', props.modelValue);
  },
});

watch(value, (v, old) => {
  if (old !== v) {
    success.value = true;
    setTimeout(() => { success.value = false; }, 1000);
  }
});
</script>
