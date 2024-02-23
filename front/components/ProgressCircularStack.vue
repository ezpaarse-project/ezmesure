<template>
  <div
    class="progress-container"
    :style="{ width: size && `${size}px`, height: size && `${size}px` }"
  >
    <v-progress-circular
      v-for="{ key, ...progress } in loaders"
      :key="`progress-${key}`"
      v-bind="progress"
    />

    <div class="label-container">
      <slot name="default" v-bind="{ labels: labelsToShow }">
        <div v-for="label in labelsToShow" :key="`label-${label.key}`">
          <slot :name="`default.__item`" v-bind="{ label }">
            <div :class="[label.color && `${label.color}--text`]">
              <slot :name="`default.${label.key}`" v-bind="{ value: label.value }">
                {{ label.value }}
              </slot>
            </div>
          </slot>
        </div>
      </slot>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    value: { type: Array, required: true },
    labels: { type: Array, default: () => [] },
    size: { type: [String, Number], default: undefined },
    width: { type: [String, Number], default: undefined },
    showEmpty: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    loaderColor: { type: String, default: undefined },
  },
  computed: {
    loaders() {
      if (this.loading) {
        return [
          {
            key: '__loading',
            size: this.size,
            width: this.width,
            indeterminate: true,
            color: this.loaderColor,
          },
        ];
      }

      const items = this.value.filter((loader) => loader.value >= 0.01 || loader.loading);

      if (items.length <= 0) {
        return [
          {
            key: '__placeholder',
            size: this.size,
            width: this.width,
            value: 0,
            color: this.loaderColor,
          },
        ];
      }

      let total = 0;
      return items.map(
        (loader) => {
          const item = {
            size: this.size,
            width: this.width,
            key: loader.key,
            color: loader.color,
            label: loader.label,
            value: loader.value * 100,
            rotate: -90 + (total * 360),
          };

          total += loader.value;
          return item;
        },
      );
    },
    labelsToShow() {
      const labels = new Set(this.labels);

      let total = 0;
      const items = this.loaders
        .filter((loader) => labels.has(loader.key))
        .map((loader) => {
          const item = {
            key: loader.key,
            value: loader.label || loader.value,
            color: loader.color,
          };

          total += loader.value;
          return item;
        });

      if (this.showEmpty && !this.loading) {
        items.push({
          key: '__empty',
          value: 100 - total,
          color: 'grey',
        });
      }

      return items;
    },
  },
});
</script>

<style scoped>
.progress-container {
  position: relative;
}

.progress-container > * {
  position: absolute;
  top: 0;
  left: 0;
}

.label-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
