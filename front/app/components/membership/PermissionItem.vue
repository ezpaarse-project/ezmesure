<template>
  <v-list-item :title="feature.text">
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
  </v-list-item>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  feature: {
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
  get: () => props.modelValue.get(props.feature.scope) || 'none',
  set: (v) => {
    if (v === 'none') {
      props.modelValue.delete(props.feature.scope);
    } else {
      props.modelValue.set(props.feature.scope, v);
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
