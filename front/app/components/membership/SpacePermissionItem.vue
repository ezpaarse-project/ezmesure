<template>
  <v-list-item :title="space.name" lines="two">
    <template #append>
      <v-slide-x-reverse-transition>
        <v-icon v-if="success" icon="mdi-check" color="success" start />
      </v-slide-x-reverse-transition>

      <PermissionSwitch
        v-model="value"
        :readonly="readonly"
        mandatory
        icons
      />
    </template>

    <template #subtitle>
      <RepositoryTypeChip :model-value="space" />
    </template>
  </v-list-item>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  space: {
    type: Object,
    required: true,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits({
  'update:modelValue': (v) => v,
});

const success = shallowRef(false);

const value = computed({
  get: () => props.modelValue.get(props.space.id) || 'none',
  set: (v) => {
    if (v === 'none') {
      props.modelValue.delete(props.space.id);
    } else {
      props.modelValue.set(props.space.id, v);
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
