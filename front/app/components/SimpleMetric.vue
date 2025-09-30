<template>
  <v-card
    :subtitle="title"
    variant="flat"
    density="compact"
  >
    <template #prepend>
      <slot name="icon">
        <v-avatar
          :icon="icon"
          :class="[`bg-${color}`, 'mr-2']"
          style="border-radius: 10%;"
        />
      </slot>
    </template>

    <template #title>
      <slot name="value">
        {{ value }}
      </slot>
    </template>

    <template v-if="$slots.actions" #text>
      <div class="text-end">
        <slot name="actions" />
      </div>
    </template>
  </v-card>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
  value: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '',
  },
});
</script>
