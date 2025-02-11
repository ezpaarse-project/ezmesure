<template>
  <v-list-item :title="alias.pattern" lines="two">
    <template #append>
      <v-slide-x-reverse-transition>
        <v-icon v-if="success" icon="mdi-check" color="success" start />
      </v-slide-x-reverse-transition>

      <PermissionSwitch
        v-model="value"
        :readonly="readonly"
        :levels="['none', 'read']"
        mandatory
      />
    </template>

    <template v-if="alias.repository" #subtitle>
      {{ alias.repository.pattern }}

      <v-chip
        :text="$te(`spaces.types.${alias.repository.type}`) ? $t(`spaces.types.${alias.repository.type}`) : alias.repository.type"
        :color="repoColors.get(alias.repository.type)"
        size="x-small"
        density="comfortable"
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
  alias: {
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

const success = ref(false);

const value = computed({
  get: () => props.modelValue.get(props.alias.pattern) || 'none',
  set: (v) => {
    if (v === 'none') {
      props.modelValue.delete(props.alias.pattern);
    } else {
      props.modelValue.set(props.alias.pattern, v);
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
