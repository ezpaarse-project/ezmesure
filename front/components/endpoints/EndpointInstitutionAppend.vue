<template>
  <div class="d-flex" style="gap: 1rem">
    <div>
      <v-icon v-if="hasError" color="error">
        mdi-alert
      </v-icon>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const hasError = computed(() => (props.item.children ?? []).some((c) => c.connection?.status === 'failed'));
</script>
