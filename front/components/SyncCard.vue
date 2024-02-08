<template>
  <v-card>
    <v-card-title>
      {{ label }}
    </v-card-title>

    <v-card-subtitle>
      <template v-if="total !== expected">
        {{ `${total} / ${expected}` }}
      </template>
      <template v-if="!total">
        {{ `? / ${expected}` }}
      </template>
    </v-card-subtitle>

    <v-card-text>
      <div class="d-flex justify-center pb-2">
        <div class="progress-container">
          <v-progress-circular
            v-if="synchronizing"
            indeterminate
            size="100"
            color="primary"
          />

          <v-progress-circular
            v-if="value.synchronized > 0"
            :value="resultProgress * 100"
            rotate="-90"
            size="100"
            color="success"
          >
            <span :style="{ transform: value.errors > 0 && 'translateY(-1rem)' }">
              {{ value.synchronized }}
            </span>
          </v-progress-circular>

          <v-progress-circular
            v-if="value.errors > 0"
            :value="errorProgress * 100"
            :rotate="errorOffset"
            size="100"
            color="error"
          >
            <span :style="{ transform: value.synchronized > 0 && 'translateY(1rem)' }">
              {{ value.errors }}
            </span>
          </v-progress-circular>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
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
    resultProgress() {
      return this.value.synchronized / this.expected;
    },
    errorProgress() {
      return this.value.errors / this.expected;
    },
    errorOffset() {
      return -90 + (this.resultProgress * 360);
    },
  },
});
</script>

<style>
.progress-container {
  position: relative;
  height: 100px;
  width: 100px;
}

.progress-container > * {
  position: absolute;
}
</style>
