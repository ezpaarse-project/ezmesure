<template>
  <v-tooltip top>
    <template #activator="{attrs, on}">
      <v-btn
        icon
        v-bind="attrs"
        @click="$emit('input', !value)"
        v-on="on"
      >
        {{ value ? '1' : '1..n' }}
      </v-btn>
    </template>

    {{ value ? exclusiveHint : inclusiveHint }}
  </v-tooltip>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      default: undefined,
    },
    inclusiveHint: {
      type: String,
      required: true,
    },
    exclusiveHint: {
      type: String,
      required: true,
    },
  },
  emits: {
    input: (val) => val != null,
  },
});
</script>
