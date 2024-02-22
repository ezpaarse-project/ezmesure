<template>
  <v-card>
    <v-card-title>
      {{ label }}
    </v-card-title>

    <v-card-subtitle>
      <template v-if="!total">
        {{ `? / ${expected}` }}
      </template>
      <template v-else-if="total !== expected">
        {{ `${total} / ${expected}` }}
      </template>
    </v-card-subtitle>

    <v-card-text>
      <div class="d-flex justify-center pb-2">
        <ProgressCircularStack
          :value="loaders"
          :loading="synchronizing && total === 0"
          :labels="['synchronized', 'errors']"
          loader-color="primary"
          size="100"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { defineComponent } from 'vue';
import ProgressCircularStack from './ProgressCircularStack.vue';

export default defineComponent({
  components: { ProgressCircularStack },
  props: {
    value: {
      type: Object,
      required: true,
    },
    expected: {
      type: Number,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    synchronizing: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    total() {
      return this.value.synchronized + this.value.errors;
    },
    loaders() {
      return [
        {
          key: 'synchronized',
          label: this.value.synchronized,
          value: this.value.synchronized / this.expected,
          color: 'success',
        },
        {
          key: 'errors',
          label: this.value.errors,
          value: this.value.errors / this.expected,
          color: 'error',
        },
      ];
    },
  },
});
</script>
