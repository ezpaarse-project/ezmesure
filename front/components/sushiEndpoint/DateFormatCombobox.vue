<template>
  <v-combobox
    :model-value="modelValue"
    hide-no-data
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template v-if="modelValue" #append-inner>
      <div style="min-width: max-content;">
        <LocalDate :model-value="now" :format="modelValue" />
      </div>
    </template>

    <template #item="{ item: { raw: item }, props: listItem }">
      <v-list-item :title="item" v-bind="listItem">
        <template #append>
          <LocalDate :model-value="now" :format="item" />
        </template>
      </v-list-item>
    </template>
  </v-combobox>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: undefined,
  },
});

defineEmits({
  'update:modelValue': (item) => typeof item === 'string',
});

const now = new Date();
</script>
