<template>
  <v-card
    :title="title"
    :subtitle="subtitle"
  >
    <template #text>
      <div class="d-flex justify-center pb-2">
        <ProgressCircularStack
          :value="loaders"
          :loading="loading && total === 0"
          size="100"
        />
      </div>
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: Object,
    required: true,
  },
  expected: {
    type: Number,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const total = computed(() => props.value.synchronized + props.value.errors);

const subtitle = computed(() => {
  if (!total.value) {
    return `? / ${props.expected}`;
  }
  if (total.value !== props.expected) {
    return `${total.value} / ${props.expected}`;
  }
  return undefined;
});

const loaders = computed(() => [
  {
    key: 'synchronized',
    label: props.value.synchronized,
    value: props.value.synchronized / props.expected,
    color: 'success',
  },
  {
    key: 'errors',
    label: props.value.errors,
    value: props.value.errors / props.expected,
    color: 'error',
  },
]);
</script>
