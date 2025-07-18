<template>
  <v-menu
    :disabled="modelValue.length <= 0"
    location="end center"
    offset="8"
    open-on-hover
  >
    <template #activator="{ props: menu }">
      <v-chip
        :text="`${modelValue.length}`"
        :variant="!modelValue.length ? 'outlined' : undefined"
        :to="to"
        prepend-icon="mdi-key"
        size="small"
        v-bind="menu"
      />
    </template>

    <v-card>
      <v-card-text class="d-flex justify-center">
        <ProgressCircularStack
          :model-value="statuses"
          :labels="['success', 'unauthorized', 'failed']"
          size="100"
        >
          <template #label="{ label }">
            <v-chip
              :text="`${label.value}`"
              :color="label.color"
              :prepend-icon="label.originalItem.icon"
              size="small"
              density="comfortable"
              variant="flat"
              style="margin: 1px 0"
            />
          </template>
        </ProgressCircularStack>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
  to: {
    type: String,
    default: undefined,
  },
});

const statuses = computed(() => {
  const itemsPerStatus = Object.groupBy(props.modelValue, (item) => item.connection?.status || 'untested');

  return Object.entries(itemsPerStatus ?? {})
    .map(([key, items]) => {
      const { icon, color } = sushiStatus.get(key) ?? {};
      return {
        key,
        label: items.length,
        value: items.length / props.modelValue.length,
        icon,
        color,
      };
    });
});
</script>
